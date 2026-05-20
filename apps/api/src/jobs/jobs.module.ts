import { Module } from "@nestjs/common";

import { EmailsModule } from "../emails/emails.module";
import { PlansModule } from "../plans/plans.module";
import { PrismaModule } from "../prisma/prisma.module";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { JobsRepository } from "./repositories/jobs.repository";

@Module({
  imports: [PrismaModule, PlansModule, EmailsModule],
  controllers: [JobsController],
  providers: [JobsService, JobsRepository],
  exports: [JobsService],
})
export class JobsModule {}
