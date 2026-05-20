import { Global, Module } from "@nestjs/common";

import { AuditModule } from "../../audit/audit.module";
import { AuthRepository } from "../../auth/repositories/auth.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { SecurityService } from "./security.service";

@Global()
@Module({
  imports: [PrismaModule, AuditModule],
  providers: [AuthRepository, SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
