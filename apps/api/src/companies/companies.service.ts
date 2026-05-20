import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ApplicationsService } from "../applications/applications.service";
import { ROLE_CODES } from "../common/constants/role-codes";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { PlansService } from "../plans/plans.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { CompaniesRepository } from "./repositories/companies.repository";

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly plansService: PlansService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  create(payload: CreateCompanyDto) {
    return this.companiesRepository.create(payload);
  }

  async getDashboard(user: AuthenticatedUser, companyId: string) {
    await this.assertCompanyAccess(user, companyId);
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException(`Empresa ${companyId} no encontrada.`);
    }

    const planStatus = await this.plansService.getCompanyPlanStatus(companyId);
    const applicationStats = await this.applicationsService.getCompanyStatistics(user, companyId);

    return {
      company,
      planStatus,
      applicationStats,
    };
  }

  async getPublishingStatus(user: AuthenticatedUser, companyId: string) {
    await this.assertCompanyAccess(user, companyId);
    return this.plansService.getCompanyPlanStatus(companyId);
  }

  findPendingApprovals() {
    return this.companiesRepository.findAllPending();
  }

  approveCompany(companyId: string) {
    return this.companiesRepository.updateStatus(companyId, "APPROVED");
  }

  async getApplicationStatistics(user: AuthenticatedUser, companyId: string) {
    await this.assertCompanyAccess(user, companyId);
    return this.applicationsService.getCompanyStatistics(user, companyId);
  }

  private async assertCompanyAccess(user: AuthenticatedUser, companyId: string) {
    if (user.role === ROLE_CODES.SYSTEM_ADMIN) {
      return;
    }

    const hasMembership = await this.companiesRepository.userHasCompanyAccess(user.sub, companyId);

    if (!hasMembership || user.companyId !== companyId) {
      throw new ForbiddenException("No tienes acceso a recursos de otra empresa.");
    }
  }
}
