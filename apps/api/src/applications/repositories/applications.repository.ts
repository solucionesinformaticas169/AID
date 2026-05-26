import { Injectable } from "@nestjs/common";
import { JobApplicationStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      include: {
        jobOffer: {
          include: {
            company: {
              select: {
                name: true,
              },
            },
          },
        },
        timelineEntries: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        appliedAt: "desc",
      },
    });
  }

  findJobOfferForApplication(jobOfferId: string) {
    return this.prisma.jobOffer.findUnique({
      where: { id: jobOfferId },
      include: {
        company: {
          include: {
            companyUsers: {
              where: {
                isActive: true,
              },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  findCandidateProfileForApplication(candidateProfileId: string) {
    return this.prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        documents: true,
        educationRecords: true,
        workExperiences: true,
        certifications: true,
        languages: true,
        user: true,
      },
    });
  }

  findCandidateProfileByUserId(userId: string) {
    return this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        documents: true,
        educationRecords: true,
        workExperiences: true,
        certifications: true,
        languages: true,
        user: true,
      },
    });
  }

  findApplicationById(id: string) {
    return this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        jobOffer: true,
        candidateProfile: true,
        timelineEntries: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  create(data: {
    jobOfferId: string;
    candidateProfileId: string;
    userId: string;
    coverLetter?: string;
    selectedEducationIds: string[];
    selectedWorkExperienceIds: string[];
    selectedCertificationIds: string[];
    calculatedYearsExperience: Prisma.Decimal;
    meetsRequirements: boolean;
    compatibilityScore: number;
    compatibilityReport: Prisma.InputJsonValue;
  }) {
    return this.prisma.jobApplication.create({
      data: {
        ...data,
        timelineEntries: {
          create: {
            status: JobApplicationStatus.APPLIED,
            title: "Enviado",
            description: "La postulacion fue registrada correctamente.",
          },
        },
      },
      include: {
        jobOffer: true,
        timelineEntries: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  updateStatus(applicationId: string, status: JobApplicationStatus, description?: string) {
    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status,
        timelineEntries: {
          create: {
            status,
            title: this.getTimelineTitle(status),
            description,
          },
        },
      },
      include: {
        timelineEntries: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  getCompanyApplicationStats(companyId: string) {
    return this.prisma.jobApplication.groupBy({
      by: ["status"],
      where: {
        jobOffer: {
          companyId,
        },
      },
      _count: {
        _all: true,
      },
      _avg: {
        compatibilityScore: true,
      },
    });
  }

  getCompanyRecentApplications(companyId: string) {
    return this.prisma.jobApplication.findMany({
      where: {
        jobOffer: {
          companyId,
        },
      },
      include: {
        candidateProfile: {
          include: {
            user: true,
          },
        },
        jobOffer: true,
        timelineEntries: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        appliedAt: "desc",
      },
      take: 10,
    });
  }

  userHasCompanyAccess(userId: string, companyId: string) {
    return this.prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });
  }

  private getTimelineTitle(status: JobApplicationStatus) {
    const titles: Record<JobApplicationStatus, string> = {
      APPLIED: "Enviado",
      REVIEWING: "En revision",
      SHORTLISTED: "Preseleccionado",
      INTERVIEW: "Entrevista",
      REJECTED: "Rechazado",
      HIRED: "Contratado",
    };

    return titles[status];
  }
}
