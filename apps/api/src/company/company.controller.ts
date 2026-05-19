import { Controller, Get, Param, Post } from "@nestjs/common";

import { CompanyService } from "./company.service";

@Controller("company")
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get(":companyId/dashboard")
  getDashboard(@Param("companyId") companyId: string) {
    return this.companyService.getDashboard(companyId);
  }

  @Get(":companyId/publishing-status")
  getPublishingStatus(@Param("companyId") companyId: string) {
    return this.companyService.getPublishingStatus(companyId);
  }

  @Post("plans/sync")
  syncDefaultPlans() {
    return this.companyService.syncDefaultPlans();
  }
}
