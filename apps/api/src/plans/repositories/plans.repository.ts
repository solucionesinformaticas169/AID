import { Injectable } from "@nestjs/common";
import { JobOfferStatus, PaymentProvider, PlanCode, Prisma, SubscriptionStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertPlan(data: {
    code: PlanCode;
    name: string;
    description: string;
    price: number;
    durationMonths: number;
    jobPostLimit: number | null;
    priorityPublication: boolean;
    advancedMetrics: boolean;
    featuredCandidates: boolean;
    includesFreePosts: boolean;
    freeJobPostsIncluded: number;
  }) {
    return this.prisma.plan.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationMonths: data.durationMonths,
        jobPostLimit: data.jobPostLimit,
        priorityPublication: data.priorityPublication,
        advancedMetrics: data.advancedMetrics,
        featuredCandidates: data.featuredCandidates,
        includesFreePosts: data.includesFreePosts,
        freeJobPostsIncluded: data.freeJobPostsIncluded,
        isActive: true,
      },
      create: data,
    });
  }

  findCompanyWithSubscriptions(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  findAllPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: {
        price: "asc",
      },
    });
  }

  createSubscription(data: {
    companyId: string;
    planId: string;
    provider?: PaymentProvider | null;
    externalSubscriptionId?: string | null;
    externalCustomerId?: string | null;
    planSnapshot?: Prisma.InputJsonValue;
    startsAt: Date;
    endsAt: Date | null;
    status?: SubscriptionStatus;
  }) {
    return this.prisma.subscription.create({
      data: {
        ...data,
        status: data.status ?? SubscriptionStatus.ACTIVE,
      },
      include: {
        plan: true,
      },
    });
  }

  countPublishedJobOffers(companyId: string) {
    return this.prisma.jobOffer.count({
      where: {
        companyId,
        status: JobOfferStatus.PUBLISHED,
      },
    });
  }

  findPlanByCode(code: PlanCode) {
    return this.prisma.plan.findUnique({
      where: { code },
    });
  }
}
