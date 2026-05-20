import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CompaniesModule } from "../companies/companies.module";
import { JobsModule } from "../jobs/jobs.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";
import { AdminRepository } from "./repositories/admin.repository";
import { AdminService } from "./admin.service";

@Module({
  imports: [PrismaModule, AuthModule, CompaniesModule, JobsModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
})
export class AdminModule {}
