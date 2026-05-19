import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";
import { ApplicationsRepository } from "./repositories/applications.repository";

@Module({
  imports: [PrismaModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
