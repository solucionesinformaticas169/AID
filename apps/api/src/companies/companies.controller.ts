import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";

import { ROLE_CODES } from "../common/constants/role-codes";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyProfileDto } from "./dto/update-company-profile.dto";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Get("public/logos")
  getPublicLogos() {
    return this.companiesService.getPublicLogos();
  }

  @Public()
  @Get("public/:companyId/logo")
  async getPublicLogoFile(
    @Param("companyId") companyId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const payload = await this.companiesService.getPublicLogoFile(companyId);
    response.setHeader("Content-Type", payload.mimeType);
    response.setHeader("Cache-Control", "public, max-age=3600");

    return new StreamableFile(payload.buffer);
  }

  @Post()
  create(@Body() payload: CreateCompanyDto) {
    return this.companiesService.create(payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get(":companyId/dashboard")
  getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
  ) {
    return this.companiesService.getDashboard(user, companyId);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get(":companyId/publishing-status")
  getPublishingStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
  ) {
    return this.companiesService.getPublishingStatus(user, companyId);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get(":companyId/application-statistics")
  getApplicationStatistics(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
  ) {
    return this.companiesService.getApplicationStatistics(user, companyId);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get(":companyId/profile")
  getProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
  ) {
    return this.companiesService.getProfile(user, companyId);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get(":companyId/logo")
  async getCompanyLogoFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const payload = await this.companiesService.getCompanyLogoFile(user, companyId);
    response.setHeader("Content-Type", payload.mimeType);
    response.setHeader("Cache-Control", "private, max-age=300");

    return new StreamableFile(payload.buffer);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN)
  @Patch(":companyId/profile")
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
    @Body() payload: UpdateCompanyProfileDto,
  ) {
    return this.companiesService.updateProfile(user, companyId, payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN)
  @Post(":companyId/logo")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        files: 1,
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  uploadLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
    @UploadedFile(
      new ParseFilePipeBuilder().build({
        fileIsRequired: true,
      }),
    )
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    return this.companiesService.uploadLogo(user, companyId, file);
  }

  @Roles(ROLE_CODES.SYSTEM_ADMIN)
  @Get("moderation/pending")
  getPendingApprovals() {
    return this.companiesService.findPendingApprovals();
  }

  @Roles(ROLE_CODES.SYSTEM_ADMIN)
  @Patch(":companyId/approve")
  approveCompany(@Param("companyId") companyId: string) {
    return this.companiesService.approveCompany(companyId);
  }
}
