import { Module } from "@nestjs/common";

import { EmailsModule } from "../emails/emails.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";
import { ApplicationsRepository } from "./repositories/applications.repository";

@Module({
  imports: [PrismaModule, EmailsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
