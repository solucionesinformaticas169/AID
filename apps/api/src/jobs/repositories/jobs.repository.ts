import { Injectable } from "@nestjs/common";
import { JobOfferStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublicJobs() {
    return this.prisma.jobOffer.findMany({
      where: {
        status: JobOfferStatus.PUBLISHED,
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

  findCompanyById(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
    });
  }

  findJobBySlug(slug: string) {
    return this.prisma.jobOffer.findUnique({
      where: { slug },
      select: { id: true },
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
    freePublication: boolean;
    priorityPublication: boolean;
  }) {
    return this.prisma.jobOffer.create({
      data: {
        ...data,
        requiredLanguages: data.requiredLanguages ?? [],
        requiredCertifications: data.requiredCertifications ?? [],
        minimumYearsExperience: data.minimumYearsExperience ?? 0,
        status: JobOfferStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }
}
