import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ApplicationsService } from "../applications/applications.service";
import { ROLE_CODES } from "../common/constants/role-codes";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { PlansService } from "../plans/plans.service";
import { SupabaseStorageService } from "../uploads/supabase-storage.service";
import type { UploadedDocumentFile } from "../uploads/uploaded-document-file.type";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyProfileDto } from "./dto/update-company-profile.dto";
import { CompaniesRepository } from "./repositories/companies.repository";

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly plansService: PlansService,
    private readonly applicationsService: ApplicationsService,
    private readonly supabaseStorageService: SupabaseStorageService,
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

  async getProfile(user: AuthenticatedUser, companyId: string) {
    await this.assertCompanyAccess(user, companyId);
    const company = await this.companiesRepository.findProfileById(companyId, user.sub);

    if (!company) {
      throw new NotFoundException(`Empresa ${companyId} no encontrada.`);
    }

    return {
      company: {
        id: company.id,
        name: company.name,
        commercialName: company.commercialName,
        taxId: company.taxId,
        city: company.city,
        country: company.country,
        address: company.address,
        website: company.website,
        logoPath: company.logoPath,
        industry: company.industry,
        contactPosition: company.contactPosition,
        billingEmail: company.billingEmail,
        status: company.status,
      },
      user: company.companyUsers[0]?.user ?? null,
    };
  }

  async updateProfile(user: AuthenticatedUser, companyId: string, payload: UpdateCompanyProfileDto) {
    await this.assertCompanyAccess(user, companyId);

    if (user.role !== ROLE_CODES.COMPANY_ADMIN) {
      throw new ForbiddenException("Solo el administrador de la empresa puede editar este perfil.");
    }

    if (payload.taxId?.trim()) {
      const existingCompany = await this.companiesRepository.findCompanyByTaxId(payload.taxId.trim());

      if (existingCompany && existingCompany.id !== companyId) {
        throw new BadRequestException("El RUC ya esta registrado por otra empresa.");
      }
    }

    const updatedProfile = await this.companiesRepository.updateProfile(companyId, user.sub, {
      ...payload,
      taxId: payload.taxId?.trim(),
      website: payload.website?.trim(),
      billingEmail: payload.billingEmail?.trim(),
    });

    return {
      company: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        commercialName: updatedProfile.commercialName,
        taxId: updatedProfile.taxId,
        city: updatedProfile.city,
        country: updatedProfile.country,
        address: updatedProfile.address,
        website: updatedProfile.website,
        logoPath: updatedProfile.logoPath,
        industry: updatedProfile.industry,
        contactPosition: updatedProfile.contactPosition,
        billingEmail: updatedProfile.billingEmail,
        status: updatedProfile.status,
      },
      user: updatedProfile.user,
    };
  }

  async uploadLogo(user: AuthenticatedUser, companyId: string, file: UploadedDocumentFile) {
    await this.assertCompanyAccess(user, companyId);

    if (user.role !== ROLE_CODES.COMPANY_ADMIN) {
      throw new ForbiddenException("Solo el administrador de la empresa puede actualizar el logo.");
    }

    const company = await this.companiesRepository.findLogoAssetById(companyId);

    if (!company) {
      throw new NotFoundException(`Empresa ${companyId} no encontrada.`);
    }

    const previousLogoPath = company.logoPath;
    const uploadedLogo = await this.supabaseStorageService.uploadCompanyLogo({
      companyId,
      file,
    });

    const updatedCompany = await this.companiesRepository.updateLogoPath(companyId, uploadedLogo.storagePath);

    if (previousLogoPath && previousLogoPath !== uploadedLogo.storagePath) {
      try {
        await this.supabaseStorageService.removeObject(previousLogoPath);
      } catch {
        // Mantiene el guardado exitoso aunque falle la limpieza del logo anterior.
      }
    }

    return {
      message: "Logo actualizado correctamente.",
      company: updatedCompany,
    };
  }

  async getPublicLogos() {
    const companies = await this.companiesRepository.findPublicCompaniesWithLogo();

    return companies.map((company) => ({
      id: company.id,
      name: company.commercialName || company.name,
      legalName: company.name,
      website: company.website,
      city: company.city,
      country: company.country,
    }));
  }

  async getPublicLogoFile(companyId: string) {
    const company = await this.companiesRepository.findLogoAssetById(companyId);

    if (!company || !company.logoPath) {
      throw new NotFoundException("Logo de empresa no disponible.");
    }

    const payload = await this.supabaseStorageService.downloadObjectPayload(company.logoPath);

    return {
      ...payload,
      fileName: `${company.commercialName || company.name}-logo`,
    };
  }

  async getCompanyLogoFile(user: AuthenticatedUser, companyId: string) {
    await this.assertCompanyAccess(user, companyId);

    const company = await this.companiesRepository.findLogoAssetById(companyId);

    if (!company || !company.logoPath) {
      throw new NotFoundException("Logo de empresa no disponible.");
    }

    const payload = await this.supabaseStorageService.downloadObjectPayload(company.logoPath);

    return {
      ...payload,
      fileName: `${company.commercialName || company.name}-logo`,
    };
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
