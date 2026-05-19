import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { Public } from "../common/decorators/public.decorator";
import { CreateJobDto } from "./dto/create-job.dto";
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

  @Post()
  createJob(@Body() payload: CreateJobDto) {
    return this.jobsService.createJob(payload);
  }
}
