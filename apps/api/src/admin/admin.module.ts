import { Module } from "@nestjs/common";

import { CompaniesModule } from "../companies/companies.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";
import { AdminRepository } from "./repositories/admin.repository";
import { AdminService } from "./admin.service";

@Module({
  imports: [PrismaModule, CompaniesModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
})
export class AdminModule {}
