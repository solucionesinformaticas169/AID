import { Global, Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AuditRepository } from "./audit.repository";
import { AuditService } from "./audit.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditRepository, AuditService],
  exports: [AuditRepository, AuditService],
})
export class AuditModule {}
