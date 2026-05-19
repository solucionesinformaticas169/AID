import { Module } from "@nestjs/common";

import { ApplicationsModule } from "../applications/applications.module";
import { PlansModule } from "../plans/plans.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";
import { CompaniesRepository } from "./repositories/companies.repository";

@Module({
  imports: [PrismaModule, PlansModule, ApplicationsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesRepository],
  exports: [CompaniesService, CompaniesRepository],
})
export class CompaniesModule {}
