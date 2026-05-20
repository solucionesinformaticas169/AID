import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { EmailsRepository } from "./repositories/emails.repository";
import { EmailsService } from "./emails.service";

@Module({
  imports: [PrismaModule],
  providers: [EmailsService, EmailsRepository],
  exports: [EmailsService],
})
export class EmailsModule {}
