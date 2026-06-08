import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { ROLE_CODES } from "../common/constants/role-codes";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyProfileDto } from "./dto/update-company-profile.dto";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

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

  @Roles(ROLE_CODES.COMPANY_ADMIN)
  @Patch(":companyId/profile")
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
    @Body() payload: UpdateCompanyProfileDto,
  ) {
    return this.companiesService.updateProfile(user, companyId, payload);
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
