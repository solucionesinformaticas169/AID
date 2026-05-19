import { Injectable } from "@nestjs/common";

import { CompaniesService } from "../companies/companies.service";
import { UsersService } from "../users/users.service";
import { AdminRepository } from "./repositories/admin.repository";

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
  ) {}

  getDashboard() {
    return this.adminRepository.getDashboard();
  }

  getPendingCompanies() {
    return this.companiesService.findPendingApprovals();
  }

  approveCompany(companyId: string) {
    return this.companiesService.approveCompany(companyId);
  }

  getUsers() {
    return this.usersService.getAll();
  }
}
