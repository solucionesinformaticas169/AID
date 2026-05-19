import { Module } from "@nestjs/common";

import { PlansModule } from "../plans/plans.module";
import { CompanyController } from "./company.controller";
import { CompanyService } from "./company.service";

@Module({
  imports: [PlansModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
