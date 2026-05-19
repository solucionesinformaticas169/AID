import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";
import { ApplicationsService } from "./applications.service";

@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get("me")
  getMyApplications(@CurrentUser() user: { sub: string }) {
    return this.applicationsService.getMyApplications(user.sub);
  }

  @Post()
  apply(@Body() payload: CreateApplicationDto) {
    return this.applicationsService.apply(payload);
  }

  @Patch(":applicationId/status")
  updateStatus(
    @Param("applicationId") applicationId: string,
    @Body() payload: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(applicationId, payload);
  }

  @Public()
  @Get("company/:companyId/statistics")
  getCompanyStatistics(@Param("companyId") companyId: string) {
    return this.applicationsService.getCompanyStatistics(companyId);
  }
}
