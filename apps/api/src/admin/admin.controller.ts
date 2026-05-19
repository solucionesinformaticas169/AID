import { Controller, Get, Param, Patch } from "@nestjs/common";

import { ROLE_CODES } from "../common/constants/role-codes";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminService } from "./admin.service";

@Roles(ROLE_CODES.SYSTEM_ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("companies/pending")
  getPendingCompanies() {
    return this.adminService.getPendingCompanies();
  }

  @Patch("companies/:companyId/approve")
  approveCompany(@Param("companyId") companyId: string) {
    return this.adminService.approveCompany(companyId);
  }

  @Get("users")
  getUsers() {
    return this.adminService.getUsers();
  }
}
