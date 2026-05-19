import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { ROLE_CODES } from "../common/constants/role-codes";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { CompaniesService } from "./companies.service";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() payload: CreateCompanyDto) {
    return this.companiesService.create(payload);
  }

  @Get(":companyId/dashboard")
  getDashboard(@Param("companyId") companyId: string) {
    return this.companiesService.getDashboard(companyId);
  }

  @Get(":companyId/publishing-status")
  getPublishingStatus(@Param("companyId") companyId: string) {
    return this.companiesService.getPublishingStatus(companyId);
  }

  @Get(":companyId/application-statistics")
  getApplicationStatistics(@Param("companyId") companyId: string) {
    return this.companiesService.getApplicationStatistics(companyId);
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
