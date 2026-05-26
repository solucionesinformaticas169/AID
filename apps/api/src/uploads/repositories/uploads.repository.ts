import { Injectable } from "@nestjs/common";
import { DocumentType, StorageProvider } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  ensureCandidateProfileForUser(userId: string) {
    return this.prisma.candidateProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  createCandidateDocument(input: {
    candidateProfileId: string;
    userId: string;
    documentType: DocumentType;
    storagePath: string;
    fileName: string;
    mimeType: string;
    size: number;
  }) {
    return this.prisma.candidateDocument.create({
      data: {
        candidateProfileId: input.candidateProfileId,
        userId: input.userId,
        type: input.documentType,
        storageProvider: StorageProvider.SUPABASE,
        storagePath: input.storagePath,
        fileName: input.fileName,
        mimeType: input.mimeType,
        size: input.size,
      },
    });
  }

  findDocumentsByCandidateUserId(userId: string) {
    return this.prisma.candidateDocument.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findDocumentsByCandidateProfileId(candidateProfileId: string) {
    return this.prisma.candidateDocument.findMany({
      where: {
        candidateProfileId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findDocumentByUserAndType(userId: string, documentType: DocumentType) {
    return this.prisma.candidateDocument.findFirst({
      where: {
        userId,
        type: documentType,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findDocumentWithAccessGraph(documentId: string) {
    return this.prisma.candidateDocument.findUnique({
      where: { id: documentId },
      include: {
        candidateProfile: {
          include: {
            applications: {
              include: {
                jobOffer: true,
              },
            },
          },
        },
        user: {
          include: {
            companyUsers: {
              where: {
                isActive: true,
              },
              select: {
                companyId: true,
              },
            },
          },
        },
      },
    });
  }

  deleteDocument(documentId: string) {
    return this.prisma.candidateDocument.delete({
      where: { id: documentId },
    });
  }

  userHasCompanyAccess(userId: string, companyId: string) {
    return this.prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });
  }
}
