import { Module } from "@nestjs/common";

import { PlansModule } from "../plans/plans.module";
import { PrismaModule } from "../prisma/prisma.module";
import { VacanciesController } from "./vacancies.controller";
import { VacanciesService } from "./vacancies.service";

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [VacanciesController],
  providers: [VacanciesService],
})
export class VacanciesModule {}
