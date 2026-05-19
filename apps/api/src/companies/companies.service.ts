import { Injectable, NotFoundException } from "@nestjs/common";

import { ApplicationsService } from "../applications/applications.service";
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

  async getDashboard(companyId: string) {
    const company = await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException(`Empresa ${companyId} no encontrada.`);
    }

    const planStatus = await this.plansService.getCompanyPlanStatus(companyId);
    const applicationStats = await this.applicationsService.getCompanyStatistics(companyId);

    return {
      company,
      planStatus,
      applicationStats,
    };
  }

  getPublishingStatus(companyId: string) {
    return this.plansService.getCompanyPlanStatus(companyId);
  }

  findPendingApprovals() {
    return this.companiesRepository.findAllPending();
  }

  approveCompany(companyId: string) {
    return this.companiesRepository.updateStatus(companyId, "APPROVED");
  }

  getApplicationStatistics(companyId: string) {
    return this.applicationsService.getCompanyStatistics(companyId);
  }
}
