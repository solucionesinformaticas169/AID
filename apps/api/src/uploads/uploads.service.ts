import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DocumentType } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AUDIT_ENTITY_TYPES } from "../audit/audit.constants";
import { CandidateService } from "../candidate/candidate.service";
import { ROLE_CODES } from "../common/constants/role-codes";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { AppLoggerService } from "../observability/app-logger.service";
import type { UploadedDocumentFile } from "./uploaded-document-file.type";
import { UploadsRepository } from "./repositories/uploads.repository";
import { SupabaseStorageService } from "./supabase-storage.service";

@Injectable()
export class UploadsService {
  constructor(
    private readonly uploadsRepository: UploadsRepository,
    private readonly storageService: SupabaseStorageService,
    private readonly candidateService: CandidateService,
    private readonly auditService: AuditService,
    private readonly logger: AppLoggerService,
  ) {}

  async uploadCandidateDocument(
    user: AuthenticatedUser,
    input: {
      documentType: DocumentType;
      file: UploadedDocumentFile;
    },
  ) {
    this.assertCandidate(user);

    if (input.documentType === DocumentType.CV) {
      const existingCv = await this.uploadsRepository.findDocumentByUserAndType(
        user.sub,
        DocumentType.CV,
      );

      if (existingCv) {
        throw new BadRequestException(
          "Solo puedes tener una hoja de vida cargada. Elimina la actual antes de subir una nueva.",
        );
      }
    }

    const effectiveCandidateProfile = await this.uploadsRepository.ensureCandidateProfileForUser(user.sub);

    const upload = await this.storageService.uploadCandidateDocument({
      candidateProfileId: effectiveCandidateProfile.id,
      documentType: input.documentType,
      file: input.file,
    });

    const document = await this.uploadsRepository.createCandidateDocument({
      candidateProfileId: effectiveCandidateProfile.id,
      userId: user.sub,
      documentType: input.documentType,
      storagePath: upload.storagePath,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      size: upload.size,
    });
    await this.auditService.record({
      action: "DOCUMENT_UPLOADED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.CANDIDATE_DOCUMENT,
      entityId: document.id,
      metadata: {
        candidateProfileId: effectiveCandidateProfile.id,
        documentType: input.documentType,
        storagePath: upload.storagePath,
        mimeType: upload.mimeType,
        size: upload.size,
      },
    });
    this.logger.info("Candidate document uploaded", {
      context: UploadsService.name,
      event: "DOCUMENT_UPLOADED",
      action: "DOCUMENT_UPLOADED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.CANDIDATE_DOCUMENT,
      entityId: document.id,
      documentType: input.documentType,
      size: upload.size,
    });
    await this.candidateService.refreshProfileCompletion(user.sub);

    return {
      message: "Documento cargado correctamente.",
      document,
    };
  }

  async getMyCandidateDocuments(user: AuthenticatedUser) {
    this.assertCandidate(user);

    return this.uploadsRepository.findDocumentsByCandidateUserId(user.sub);
  }

  async getCandidateDocumentsByProfile(user: AuthenticatedUser, candidateProfileId: string) {
    const documents = await this.uploadsRepository.findDocumentsByCandidateProfileId(candidateProfileId);

    if (documents.length === 0) {
      return [];
    }

    await this.assertDocumentAccess(user, documents[0].id);
    return documents;
  }

  async getSignedDocumentUrl(
    user: AuthenticatedUser,
    documentId: string,
    options?: { download?: boolean },
  ) {
    const document = await this.assertDocumentAccess(user, documentId);
    const signedUrl = await this.storageService.createSignedUrl(
      document.storagePath,
      options?.download ?? false,
    );

    return {
      documentId: document.id,
      signedUrl,
      expiresInSeconds: 600,
    };
  }

  async deleteDocument(user: AuthenticatedUser, documentId: string) {
    const document = await this.assertDocumentAccess(user, documentId, { requireOwnerOrAdmin: true });

    await this.storageService.removeObject(document.storagePath);
    await this.uploadsRepository.deleteDocument(document.id);
    await this.auditService.record({
      action: "DOCUMENT_DELETED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.CANDIDATE_DOCUMENT,
      entityId: document.id,
      metadata: {
        candidateProfileId: document.candidateProfileId,
        documentType: document.type,
        storagePath: document.storagePath,
      },
    });
    this.logger.info("Candidate document deleted", {
      context: UploadsService.name,
      event: "DOCUMENT_DELETED",
      action: "DOCUMENT_DELETED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.CANDIDATE_DOCUMENT,
      entityId: document.id,
      documentType: document.type,
    });
    await this.candidateService.refreshProfileCompletion(user.sub);

    return {
      message: "Documento eliminado correctamente.",
    };
  }

  private async assertDocumentAccess(
    user: AuthenticatedUser,
    documentId: string,
    options?: { requireOwnerOrAdmin?: boolean },
  ) {
    const document = await this.uploadsRepository.findDocumentWithAccessGraph(documentId);

    if (!document) {
      throw new NotFoundException(`Documento ${documentId} no encontrado.`);
    }

    if (user.role === ROLE_CODES.SYSTEM_ADMIN) {
      return document;
    }

    const isOwner = document.userId === user.sub;

    if (options?.requireOwnerOrAdmin) {
      if (!isOwner) {
        throw new ForbiddenException("Solo el candidato propietario o un administrador puede eliminar el documento.");
      }

      return document;
    }

    if (isOwner) {
      return document;
    }

    if (user.role === ROLE_CODES.COMPANY_ADMIN || user.role === ROLE_CODES.RECRUITER) {
      if (!user.companyId) {
        throw new ForbiddenException("Tu usuario no tiene una empresa activa asociada.");
      }

      const hasMembership = await this.uploadsRepository.userHasCompanyAccess(user.sub, user.companyId);

      if (!hasMembership) {
        throw new ForbiddenException("No tienes acceso activo a esta empresa.");
      }

      const candidateAppliedToCompany = document.candidateProfile.applications.some(
        (application) => application.jobOffer.companyId === user.companyId,
      );

      if (candidateAppliedToCompany) {
        return document;
      }
    }

    throw new ForbiddenException("No tienes permisos para acceder a este documento.");
  }

  private assertCandidate(user: AuthenticatedUser) {
    if (user.role !== ROLE_CODES.CANDIDATE) {
      throw new ForbiddenException("Solo el candidato propietario puede gestionar sus documentos.");
    }
  }
}
