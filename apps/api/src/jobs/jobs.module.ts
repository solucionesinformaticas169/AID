import { Module } from "@nestjs/common";

import { PlansModule } from "../plans/plans.module";
import { PrismaModule } from "../prisma/prisma.module";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { JobsRepository } from "./repositories/jobs.repository";

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [JobsController],
  providers: [JobsService, JobsRepository],
})
export class JobsModule {}
