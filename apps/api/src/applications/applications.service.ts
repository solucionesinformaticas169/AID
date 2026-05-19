import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { JobApplicationStatus, Prisma } from "@prisma/client";

import { CreateApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";
import { ApplicationsRepository } from "./repositories/applications.repository";

@Injectable()
export class ApplicationsService {
  constructor(private readonly applicationsRepository: ApplicationsRepository) {}

  getMyApplications(userId: string) {
    return this.applicationsRepository.findByUserId(userId);
  }

  async apply(payload: CreateApplicationDto) {
    const [jobOffer, candidateProfile] = await Promise.all([
      this.applicationsRepository.findJobOfferForApplication(payload.jobOfferId),
      this.applicationsRepository.findCandidateProfileForApplication(payload.candidateProfileId),
    ]);

    if (!jobOffer) {
      throw new NotFoundException(`Vacante ${payload.jobOfferId} no encontrada.`);
    }

    if (!candidateProfile) {
      throw new NotFoundException(`Perfil candidato ${payload.candidateProfileId} no encontrado.`);
    }

    const selectedEducation = candidateProfile.educationRecords.filter((education) =>
      payload.selectedEducationIds.includes(education.id),
    );
    const selectedWorkExperiences = candidateProfile.workExperiences.filter((experience) =>
      payload.selectedWorkExperienceIds.includes(experience.id),
    );
    const selectedCertifications = candidateProfile.certifications.filter((certification) =>
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
    const candidateLanguages = candidateProfile.languages.map((language) => language.name.toLowerCase());
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

    return this.applicationsRepository.create({
      jobOfferId: payload.jobOfferId,
      candidateProfileId: payload.candidateProfileId,
      userId: payload.userId,
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
  }

  async updateStatus(applicationId: string, payload: UpdateApplicationStatusDto) {
    const existingApplication = await this.applicationsRepository.findApplicationById(applicationId);

    if (!existingApplication) {
      throw new NotFoundException(`Postulacion ${applicationId} no encontrada.`);
    }

    return this.applicationsRepository.updateStatus(applicationId, payload.status, payload.note);
  }

  async getCompanyStatistics(companyId: string) {
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
      recentApplications,
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
