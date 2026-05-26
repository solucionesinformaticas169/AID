import { Injectable } from "@nestjs/common";
import { JobOfferStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublicJobs() {
    const now = new Date();

    return this.prisma.jobOffer.findMany({
      where: {
        status: JobOfferStatus.PUBLISHED,
        OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
        AND: [{ OR: [{ closesAt: null }, { closesAt: { gte: now } }] }],
      },
      include: {
        company: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.jobOffer.findUnique({
      where: { slug },
      include: {
        company: true,
      },
    });
  }

  findById(jobId: string) {
    return this.prisma.jobOffer.findUnique({
      where: { id: jobId },
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

  findCompanyById(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
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
    });
  }

  findJobBySlug(slug: string) {
    return this.prisma.jobOffer.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  findPendingModerationJobs() {
    return this.prisma.jobOffer.findMany({
      where: {
        status: {
          in: [JobOfferStatus.DRAFT, JobOfferStatus.PAUSED],
        },
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  findByCompanyId(companyId: string) {
    return this.prisma.jobOffer.findMany({
      where: {
        companyId,
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  incrementFreePostsUsed(companyId: string) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        freeJobPostsUsed: {
          increment: 1,
        },
      },
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

  createJob(data: {
    companyId: string;
    createdByUserId: string;
    title: string;
    slug: string;
    description: string;
    requirements?: string;
    responsibilities?: string;
    benefits?: string;
    city?: string;
    country?: string;
    requiredEducationLevel?: string;
    minimumYearsExperience?: number;
    requiredLanguages?: string[];
    requiredCertifications?: string[];
    salaryMin?: number | null;
    salaryMax?: number | null;
    freePublication: boolean;
    priorityPublication: boolean;
    status: JobOfferStatus;
    publishedAt?: Date | null;
    closesAt?: Date | null;
  }) {
    return this.prisma.jobOffer.create({
      data: {
        ...data,
        requiredLanguages: data.requiredLanguages ?? [],
        requiredCertifications: data.requiredCertifications ?? [],
        minimumYearsExperience: data.minimumYearsExperience ?? 0,
      },
    });
  }

  updateJob(
    jobId: string,
    data: {
      title?: string;
      description?: string;
      requirements?: string;
      responsibilities?: string;
      benefits?: string;
      city?: string;
      country?: string;
      requiredEducationLevel?: string;
      minimumYearsExperience?: number;
      requiredLanguages?: string[];
      requiredCertifications?: string[];
      salaryMin?: number | null;
      salaryMax?: number | null;
      publishedAt?: Date | null;
      closesAt?: Date | null;
    },
  ) {
    return this.prisma.jobOffer.update({
      where: { id: jobId },
      data: {
        ...data,
        requiredLanguages: data.requiredLanguages,
        requiredCertifications: data.requiredCertifications,
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }

  updateModerationStatus(jobId: string, status: JobOfferStatus) {
    return this.prisma.jobOffer.update({
      where: { id: jobId },
      data: {
        status,
        publishedAt: status === JobOfferStatus.PUBLISHED ? new Date() : null,
      },
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

  updateStatus(
    jobId: string,
    status: JobOfferStatus,
    publishedAt?: Date | null,
  ) {
    return this.prisma.jobOffer.update({
      where: { id: jobId },
      data: {
        status,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }
}
