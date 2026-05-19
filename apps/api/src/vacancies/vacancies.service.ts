import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { JobOfferStatus, Prisma } from "@prisma/client";

import { PlansService } from "../plans/plans.service";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateVacancyDto {
  companyId: string;
  createdByUserId: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  city?: string;
  country?: string;
}

@Injectable()
export class VacanciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plansService: PlansService,
  ) {}

  private readonly seedVacancies = [
    {
      id: "vac-001",
      title: "Analista de Talento Humano",
      status: "PUBLISHED",
    },
    {
      id: "vac-002",
      title: "Reclutador Senior TI",
      status: "PUBLISHED",
    },
  ];

  getPublicVacancies() {
    return this.seedVacancies;
  }

  getVacancyById(id: string) {
    return this.seedVacancies.find((vacancy) => vacancy.id === id) ?? null;
  }

  async createVacancy(payload: CreateVacancyDto) {
    if (!payload.companyId || !payload.createdByUserId || !payload.title || !payload.description) {
      throw new BadRequestException(
        "companyId, createdByUserId, title y description son obligatorios para publicar una vacante.",
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: payload.companyId },
    });

    if (!company) {
      throw new NotFoundException(`Empresa ${payload.companyId} no encontrada.`);
    }

    const publishingStatus = await this.plansService.assertCompanyCanPublish(payload.companyId);
    const willConsumeFreePost = publishingStatus.freePostsRemaining > 0;
    const slug = await this.generateUniqueSlug(payload.title);

    const createdVacancy = await this.prisma.$transaction(async (tx) => {
      if (willConsumeFreePost) {
        await tx.company.update({
          where: { id: payload.companyId },
          data: {
            freeJobPostsUsed: {
              increment: 1,
            },
          },
        });
      }

      return tx.jobOffer.create({
        data: {
          companyId: payload.companyId,
          createdByUserId: payload.createdByUserId,
          title: payload.title,
          slug,
          description: payload.description,
          requirements: payload.requirements,
          responsibilities: payload.responsibilities,
          benefits: payload.benefits,
          city: payload.city,
          country: payload.country,
          status: JobOfferStatus.PUBLISHED,
          freePublication: willConsumeFreePost,
          publishedAt: new Date(),
        },
      });
    });

    const refreshedStatus = await this.plansService.getCompanyPlanStatus(payload.companyId);

    return {
      message: willConsumeFreePost
        ? "Vacante publicada usando una carga gratuita."
        : "Vacante publicada con suscripcion activa.",
      vacancy: createdVacancy,
      planStatus: refreshedStatus,
    };
  }

  private async generateUniqueSlug(title: string) {
    const baseSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "vacante";

    let attempt = 0;

    while (true) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const existing = await this.prisma.jobOffer.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }

      attempt += 1;
    }
  }
}
