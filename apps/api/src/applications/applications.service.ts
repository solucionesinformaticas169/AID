import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DocumentType, JobApplicationStatus, Prisma } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AUDIT_ENTITY_TYPES } from "../audit/audit.constants";
import { ROLE_CODES } from "../common/constants/role-codes";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { EmailsService } from "../emails/emails.service";
import { AppLoggerService } from "../observability/app-logger.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";
import { ApplicationsRepository } from "./repositories/applications.repository";

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepository: ApplicationsRepository,
    private readonly emailsService: EmailsService,
    private readonly auditService: AuditService,
    private readonly logger: AppLoggerService,
  ) {}

  getMyApplications(userId: string) {
    return this.applicationsRepository.findByUserId(userId);
  }

  async apply(user: AuthenticatedUser, payload: CreateApplicationDto) {
    const candidateProfile = await this.applicationsRepository.findCandidateProfileByUserId(user.sub);

    if (!candidateProfile) {
      throw new NotFoundException("No se encontro un perfil de candidato para este usuario.");
    }

    const [jobOffer, hydratedCandidateProfile] = await Promise.all([
      this.applicationsRepository.findJobOfferForApplication(payload.jobOfferId),
      this.applicationsRepository.findCandidateProfileForApplication(candidateProfile.id),
    ]);

    if (!jobOffer) {
      throw new NotFoundException(`Vacante ${payload.jobOfferId} no encontrada.`);
    }

    if (!hydratedCandidateProfile) {
      throw new NotFoundException(`Perfil candidato ${candidateProfile.id} no encontrado.`);
    }

    const hasCurriculumVitae = hydratedCandidateProfile.documents.some(
      (document) => document.type === DocumentType.CV,
    );

    if (!hasCurriculumVitae) {
      throw new BadRequestException(
        "Debes subir tu hoja de vida en PDF antes de postular a una vacante.",
      );
    }

    if ((hydratedCandidateProfile.profileCompletion ?? 0) < 50) {
      throw new BadRequestException(
        "Debes completar al menos el 50% de tu hoja de vida antes de postular.",
      );
    }

    const selectedEducation = hydratedCandidateProfile.educationRecords.filter((education) =>
      payload.selectedEducationIds.includes(education.id),
    );
    const selectedWorkExperiences = hydratedCandidateProfile.workExperiences.filter((experience) =>
      payload.selectedWorkExperienceIds.includes(experience.id),
    );
    const selectedCertifications = hydratedCandidateProfile.certifications.filter((certification) =>
      payload.selectedCertificationIds.includes(certification.id),
    );

    if (
      selectedEducation.length !== payload.selectedEducationIds.length ||
      selectedWorkExperiences.length !== payload.selectedWorkExperienceIds.length ||
      selectedCertifications.length !== payload.selectedCertificationIds.length
    ) {
      throw new BadRequestException("La seleccion contiene registros que no pertenecen al candidato.");
    }

    const calculatedYearsExperience = this.calculateYearsExperience(selectedWorkExperiences);
    const educationRequirementMet = jobOffer.requiredEducationLevel
      ? selectedEducation.some(
          (education) =>
            education.degree.toLowerCase() === jobOffer.requiredEducationLevel?.toLowerCase(),
        )
      : true;
    const experienceRequirementMet = calculatedYearsExperience >= (jobOffer.minimumYearsExperience ?? 0);

    const requiredLanguages = this.toStringArray(jobOffer.requiredLanguages);
    const candidateLanguages = hydratedCandidateProfile.languages.map((language) =>
      language.name.toLowerCase(),
    );
    const matchedLanguages = requiredLanguages.filter((language) =>
      candidateLanguages.includes(language.toLowerCase()),
    );
    const languagesRequirementMet =
      requiredLanguages.length === 0 || matchedLanguages.length === requiredLanguages.length;

    const requiredCertifications = this.toStringArray(jobOffer.requiredCertifications);
    const candidateCertificationNames = selectedCertifications.map((certification) => certification.name.toLowerCase());
    const matchedCertifications = requiredCertifications.filter((certification) =>
      candidateCertificationNames.includes(certification.toLowerCase()),
    );
    const certificationsRequirementMet =
      requiredCertifications.length === 0 ||
      matchedCertifications.length === requiredCertifications.length;

    const compatibilityScore = this.calculateCompatibilityScore({
      educationRequired: Boolean(jobOffer.requiredEducationLevel),
      educationMet: educationRequirementMet,
      experienceRequired: (jobOffer.minimumYearsExperience ?? 0) > 0,
      experienceMet: experienceRequirementMet,
      languageRequired: requiredLanguages.length > 0,
      languageMet: languagesRequirementMet,
      certificationRequired: requiredCertifications.length > 0,
      certificationMet: certificationsRequirementMet,
    });

    const meetsRequirements =
      educationRequirementMet &&
      experienceRequirementMet &&
      languagesRequirementMet &&
      certificationsRequirementMet;

    const application = await this.applicationsRepository.create({
      jobOfferId: payload.jobOfferId,
      candidateProfileId: candidateProfile.id,
      userId: user.sub,
      coverLetter: payload.coverLetter,
      selectedEducationIds: payload.selectedEducationIds,
      selectedWorkExperienceIds: payload.selectedWorkExperienceIds,
      selectedCertificationIds: payload.selectedCertificationIds,
      calculatedYearsExperience: new Prisma.Decimal(calculatedYearsExperience.toFixed(2)),
      meetsRequirements,
      compatibilityScore,
      compatibilityReport: {
        education: {
          requiredLevel: jobOffer.requiredEducationLevel,
          matched: educationRequirementMet,
          selectedEducationIds: payload.selectedEducationIds,
        },
        experience: {
          requiredYears: jobOffer.minimumYearsExperience ?? 0,
          calculatedYearsExperience,
          matched: experienceRequirementMet,
          selectedWorkExperienceIds: payload.selectedWorkExperienceIds,
        },
        languages: {
          required: requiredLanguages,
          matched: matchedLanguages,
          matchedAll: languagesRequirementMet,
        },
        certifications: {
          required: requiredCertifications,
          matched: matchedCertifications,
          matchedAll: certificationsRequirementMet,
          selectedCertificationIds: payload.selectedCertificationIds,
        },
      },
    });
    await this.auditService.record({
      action: "APPLICATION_CREATED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.JOB_APPLICATION,
      entityId: application.id,
      metadata: {
        jobOfferId: payload.jobOfferId,
        candidateProfileId: candidateProfile.id,
        compatibilityScore,
        meetsRequirements,
      },
    });
    this.logger.info("Application created successfully", {
      context: ApplicationsService.name,
      event: "APPLICATION_CREATED",
      action: "APPLICATION_CREATED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.JOB_APPLICATION,
      entityId: application.id,
      compatibilityScore,
      meetsRequirements,
    });

    void Promise.allSettled([
      this.emailsService.sendApplicationSubmittedEmail({
        userId: candidateProfile.user.id,
        recipientEmail: hydratedCandidateProfile.user.email,
        candidateName: `${hydratedCandidateProfile.user.firstName} ${hydratedCandidateProfile.user.lastName}`.trim(),
        jobTitle: jobOffer.title,
        companyName: jobOffer.company.name,
        dashboardUrl: this.emailsService.buildCandidateDashboardUrl(),
        applicationId: application.id,
      }),
      ...jobOffer.company.companyUsers.map((companyUser) =>
        this.emailsService.sendNewApplicationEmail({
          userId: companyUser.user.id,
          recipientEmail: companyUser.user.email,
          recruiterName: `${companyUser.user.firstName} ${companyUser.user.lastName}`.trim(),
          candidateName: `${hydratedCandidateProfile.user.firstName} ${hydratedCandidateProfile.user.lastName}`.trim(),
          jobTitle: jobOffer.title,
          dashboardUrl: this.emailsService.buildCompanyDashboardUrl(),
          applicationId: application.id,
        }),
      ),
    ]);

    return application;
  }

  async updateStatus(
    user: AuthenticatedUser,
    applicationId: string,
    payload: UpdateApplicationStatusDto,
  ) {
    const existingApplication = await this.applicationsRepository.findApplicationById(applicationId);

    if (!existingApplication) {
      throw new NotFoundException(`Postulacion ${applicationId} no encontrada.`);
    }

    if (user.role !== ROLE_CODES.SYSTEM_ADMIN) {
      const hasMembership = await this.applicationsRepository.userHasCompanyAccess(
        user.sub,
        existingApplication.jobOffer.companyId,
      );

      if (!hasMembership || user.companyId !== existingApplication.jobOffer.companyId) {
        throw new ForbiddenException("No tienes acceso a postulaciones de otra empresa.");
      }
    }

    return this.applicationsRepository.updateStatus(applicationId, payload.status, payload.note);
  }

  async getCompanyStatistics(user: AuthenticatedUser, companyId: string) {
    if (user.role !== ROLE_CODES.SYSTEM_ADMIN) {
      const hasMembership = await this.applicationsRepository.userHasCompanyAccess(user.sub, companyId);

      if (!hasMembership || user.companyId !== companyId) {
        throw new ForbiddenException("No tienes acceso a estadisticas de otra empresa.");
      }
    }

    const [groupedStats, recentApplications] = await Promise.all([
      this.applicationsRepository.getCompanyApplicationStats(companyId),
      this.applicationsRepository.getCompanyRecentApplications(companyId),
    ]);

    const normalizedStatuses: JobApplicationStatus[] = [
      JobApplicationStatus.APPLIED,
      JobApplicationStatus.REVIEWING,
      JobApplicationStatus.SHORTLISTED,
      JobApplicationStatus.INTERVIEW,
      JobApplicationStatus.REJECTED,
      JobApplicationStatus.HIRED,
    ];

    const byStatus = normalizedStatuses.map((status) => {
      const row = groupedStats.find((item) => item.status === status);
      return {
        status,
        total: row?._count._all ?? 0,
        averageCompatibility: Math.round(row?._avg.compatibilityScore ?? 0),
      };
    });

    const totalApplications = byStatus.reduce((sum, item) => sum + item.total, 0);
    const weightedCompatibility = byStatus.reduce(
      (sum, item) => sum + item.averageCompatibility * item.total,
      0,
    );

    return {
      totalApplications,
      averageCompatibility:
        totalApplications > 0 ? Math.round(weightedCompatibility / totalApplications) : 0,
      byStatus,
      recentApplications: recentApplications.map((application) => ({
        id: application.id,
        status: application.status,
        compatibilityScore: application.compatibilityScore,
        appliedAt: application.appliedAt,
        candidate: {
          id: application.candidateProfile.user.id,
          name:
            `${application.candidateProfile.user.firstName} ${application.candidateProfile.user.lastName}`.trim(),
          email: application.candidateProfile.user.email,
        },
        jobOffer: {
          id: application.jobOffer.id,
          title: application.jobOffer.title,
          companyId: application.jobOffer.companyId,
        },
        timelineEntries: application.timelineEntries.map((entry) => ({
          id: entry.id,
          status: entry.status,
          title: entry.title,
          description: entry.description,
          createdAt: entry.createdAt,
        })),
      })),
    };
  }

  private calculateYearsExperience(
    workExperiences: Array<{ startDate: Date | null; endDate: Date | null; isCurrent: boolean }>,
  ) {
    const now = new Date();
    const totalMonths = workExperiences.reduce((sum, experience) => {
      if (!experience.startDate) {
        return sum;
      }

      const endDate = experience.isCurrent || !experience.endDate ? now : experience.endDate;
      const months =
        (endDate.getFullYear() - experience.startDate.getFullYear()) * 12 +
        (endDate.getMonth() - experience.startDate.getMonth()) +
        1;

      return sum + Math.max(months, 0);
    }, 0);

    return totalMonths / 12;
  }

  private calculateCompatibilityScore(input: {
    educationRequired: boolean;
    educationMet: boolean;
    experienceRequired: boolean;
    experienceMet: boolean;
    languageRequired: boolean;
    languageMet: boolean;
    certificationRequired: boolean;
    certificationMet: boolean;
  }) {
    const checks = [
      [input.educationRequired, input.educationMet],
      [input.experienceRequired, input.experienceMet],
      [input.languageRequired, input.languageMet],
      [input.certificationRequired, input.certificationMet],
    ].filter(([required]) => required);

    if (checks.length === 0) {
      return 100;
    }

    const matched = checks.filter(([, met]) => met).length;
    return Math.round((matched / checks.length) * 100);
  }

  private toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }
}
