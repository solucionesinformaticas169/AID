import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";

import { ROLE_CODES } from "../common/constants/role-codes";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { DocumentUrlQueryDto } from "./dto/document-url-query.dto";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import type { UploadedDocumentFile } from "./uploaded-document-file.type";
import { UploadsService } from "./uploads.service";
import type { Response } from "express";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(ROLE_CODES.CANDIDATE)
  @Get("documents/me")
  getMyCandidateDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.uploadsService.getMyCandidateDocuments(user);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get("candidate-profile/:candidateProfileId/documents")
  getCandidateDocumentsByProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("candidateProfileId") candidateProfileId: string,
  ) {
    return this.uploadsService.getCandidateDocumentsByProfile(user, candidateProfileId);
  }

  @Roles(ROLE_CODES.CANDIDATE)
  @Post("documents")
  @Throttle({
    default: {
      limit: () => Number(process.env.UPLOAD_RATE_LIMIT_MAX ?? "10"),
      ttl: () => Number(process.env.RATE_LIMIT_TTL_SECONDS ?? "60") * 1000,
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        files: 1,
        fileSize: Number(process.env.MAX_UPLOAD_MB ?? "8") * 1024 * 1024,
      },
    }),
  )
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: UploadDocumentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .build({
          fileIsRequired: true,
        }),
    )
    file: UploadedDocumentFile,
  ) {
    return this.uploadsService.uploadCandidateDocument(user, {
      documentType: payload.documentType,
      file,
    });
  }

  @Get("documents/:documentId/url")
  getSignedUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param("documentId") documentId: string,
    @Query() query: DocumentUrlQueryDto,
  ) {
    return this.uploadsService.getSignedDocumentUrl(user, documentId, {
      download: query.download,
    });
  }

  @Get("documents/:documentId/file")
  async getDocumentFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("documentId") documentId: string,
    @Query() query: DocumentUrlQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const payload = await this.uploadsService.getDocumentFile(user, documentId);
    const safeFileName = encodeURIComponent(payload.fileName);

    response.setHeader("Content-Type", payload.mimeType);
    response.setHeader(
      "Content-Disposition",
      `${query.download ? "attachment" : "inline"}; filename*=UTF-8''${safeFileName}`,
    );

    return new StreamableFile(payload.buffer);
  }

  @Delete("documents/:documentId")
  deleteDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param("documentId") documentId: string,
  ) {
    return this.uploadsService.deleteDocument(user, documentId);
  }
}
