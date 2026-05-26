import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { ROLE_CODES } from "../common/constants/role-codes";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { UpdateJobVisibilityDto } from "./dto/update-job-visibility.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get("public")
  getPublicJobs() {
    return this.jobsService.getPublicJobs();
  }

  @Public()
  @Get(":slug")
  getJobBySlug(@Param("slug") slug: string) {
    return this.jobsService.getJobBySlug(slug);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Post()
  createJob(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: CreateJobDto,
  ) {
    return this.jobsService.createJob(user, payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Patch(":jobId")
  updateJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param("jobId") jobId: string,
    @Body() payload: UpdateJobDto,
  ) {
    return this.jobsService.updateJob(user, jobId, payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Patch(":jobId/visibility")
  updateJobVisibility(
    @CurrentUser() user: AuthenticatedUser,
    @Param("jobId") jobId: string,
    @Body() payload: UpdateJobVisibilityDto,
  ) {
    return this.jobsService.updateJobVisibility(user, jobId, payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get("company/:companyId")
  getCompanyJobs(
    @CurrentUser() user: AuthenticatedUser,
    @Param("companyId") companyId: string,
  ) {
    return this.jobsService.getCompanyJobs(user, companyId);
  }
}
