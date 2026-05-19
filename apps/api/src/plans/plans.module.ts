import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { PlansController } from "./plans.controller";
import { PlansRepository } from "./repositories/plans.repository";
import { PlansService } from "./plans.service";

@Module({
  imports: [PrismaModule],
  controllers: [PlansController],
  providers: [PlansService, PlansRepository],
  exports: [PlansService],
})
export class PlansModule {}
