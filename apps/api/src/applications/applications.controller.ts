import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ROLE_CODES } from "../common/constants/role-codes";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";
import { ApplicationsService } from "./applications.service";

@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Roles(ROLE_CODES.CANDIDATE)
  @Get("me")
  getMyApplications(@CurrentUser() user: { sub: string }) {
    return this.applicationsService.getMyApplications(user.sub);
  }

  @Roles(ROLE_CODES.CANDIDATE)
  @Post()
  apply(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: CreateApplicationDto,
  ) {
    return this.applicationsService.apply(user, payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Patch(":applicationId/status")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("applicationId") applicationId: string,
    @Body() payload: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user, applicationId, payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get("company/:companyId/statistics")
  getCompanyStatistics(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
  ) {
    return this.applicationsService.getCompanyStatistics(user, companyId);
  }
}
