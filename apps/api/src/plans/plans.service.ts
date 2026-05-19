import { Injectable, NotFoundException } from "@nestjs/common";
import { PlanCode, SubscriptionStatus } from "@prisma/client";

import { PlansRepository } from "./repositories/plans.repository";

const PLAN_CATALOG = [
  {
    code: PlanCode.FREE,
    name: "Gratis",
    description: "Ideal para iniciar con 10 publicaciones gratuitas y operacion basica.",
    price: 0,
    durationMonths: 0,
    jobPostLimit: 10,
    priorityPublication: false,
    advancedMetrics: false,
    featuredCandidates: false,
    includesFreePosts: true,
    freeJobPostsIncluded: 10,
  },
  {
    code: PlanCode.PROFESSIONAL,
    name: "Profesional",
    description: "Mas vacantes, prioridad en publicaciones y metricas empresariales.",
    price: 49,
    durationMonths: 1,
    jobPostLimit: 25,
    priorityPublication: true,
    advancedMetrics: true,
    featuredCandidates: true,
    includesFreePosts: false,
    freeJobPostsIncluded: 0,
  },
  {
    code: PlanCode.ENTERPRISE,
    name: "Empresarial",
    description: "Escala ATS con vacantes amplias, prioridad y capacidades premium.",
    price: 149,
    durationMonths: 1,
    jobPostLimit: null,
    priorityPublication: true,
    advancedMetrics: true,
    featuredCandidates: true,
    includesFreePosts: false,
    freeJobPostsIncluded: 0,
  },
] as const;

type ActiveSubscriptionWithPlan = {
  id: string;
  status: SubscriptionStatus;
  startsAt: Date;
  endsAt: Date | null;
  plan: {
    code: PlanCode;
    name: string;
    price: unknown;
    currency: string;
    jobPostLimit: number | null;
    priorityPublication: boolean;
    advancedMetrics: boolean;
    featuredCandidates: boolean;
  };
} | null;

@Injectable()
export class PlansService {
  constructor(private readonly plansRepository: PlansRepository) {}

  getPlans() {
    return PLAN_CATALOG.map((plan) => ({
      ...plan,
      label: plan.name,
    }));
  }

  async syncDefaultPlans() {
    for (const plan of PLAN_CATALOG) {
      await this.plansRepository.upsertPlan({
        ...plan,
      });
    }

    return this.getPlans();
  }

  async getCompanyPlanStatus(companyId: string) {
    const [company, publishedJobsCount] = await Promise.all([
      this.plansRepository.findCompanyWithSubscriptions(companyId),
      this.plansRepository.countPublishedJobOffers(companyId),
    ]);

    if (!company) {
      throw new NotFoundException(`Empresa ${companyId} no encontrada.`);
    }

    const activeSubscription = this.findActiveSubscription(company.subscriptions);
    const fallbackFreePlan = PLAN_CATALOG.find((plan) => plan.code === PlanCode.FREE)!;
    const effectivePlan = activeSubscription?.plan ?? fallbackFreePlan;
    const freePostsRemaining = Math.max(0, company.freeJobPostsIncluded - company.freeJobPostsUsed);
    const planJobLimit = effectivePlan.jobPostLimit;
    const withinPlanLimit = planJobLimit === null || publishedJobsCount < planJobLimit;
    const canPublish = freePostsRemaining > 0 || (Boolean(activeSubscription) && withinPlanLimit);

    return {
      companyId: company.id,
      activePlan: effectivePlan.code,
      activePlanName: effectivePlan.name,
      freePostsIncluded: company.freeJobPostsIncluded,
      freePostsUsed: company.freeJobPostsUsed,
      freePostsRemaining,
      publishedJobsCount,
      jobPostLimit: planJobLimit,
      availableJobSlots: planJobLimit === null ? null : Math.max(planJobLimit - publishedJobsCount, 0),
      priorityPublication: effectivePlan.priorityPublication ?? false,
      advancedMetrics: effectivePlan.advancedMetrics ?? false,
      featuredCandidates: effectivePlan.featuredCandidates ?? false,
      hasActiveSubscription: Boolean(activeSubscription),
      canPublish,
      publicationRule:
        freePostsRemaining > 0
          ? "La empresa aun puede publicar con sus cargas gratuitas."
          : activeSubscription && !withinPlanLimit
            ? "La empresa tiene suscripcion activa, pero ya alcanzo el limite de vacantes de su plan."
          : activeSubscription
            ? "La empresa puede publicar con su suscripcion activa."
            : "La empresa necesita una suscripcion activa para volver a publicar.",
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            code: activeSubscription.plan.code,
            name: activeSubscription.plan.name,
            status: activeSubscription.status,
            startsAt: activeSubscription.startsAt,
            endsAt: activeSubscription.endsAt,
          }
        : null,
    };
  }

  getPersistedPlans() {
    return this.plansRepository.findAllPlans();
  }

  async assertCompanyCanPublish(companyId: string) {
    const status = await this.getCompanyPlanStatus(companyId);

    if (!status.canPublish) {
      throw new NotFoundException(
        "La empresa ya consumio sus 10 cargas gratuitas y no tiene una suscripcion activa.",
      );
    }

    return status;
  }

  async getPlanByCode(planCode: PlanCode) {
    const plan = await this.plansRepository.findPlanByCode(planCode);

    if (!plan) {
      throw new NotFoundException(`Plan ${planCode} no encontrado.`);
    }

    return plan;
  }

  private findActiveSubscription(
    subscriptions: Array<{
      id: string;
      status: SubscriptionStatus;
      startsAt: Date;
      endsAt: Date | null;
      plan: {
        code: PlanCode;
        name: string;
        price: unknown;
        currency: string;
        jobPostLimit: number | null;
        priorityPublication: boolean;
        advancedMetrics: boolean;
        featuredCandidates: boolean;
      };
    }>,
  ): ActiveSubscriptionWithPlan {
    const now = new Date();

    return (
      subscriptions.find((subscription) => {
        const isAllowedStatus =
          subscription.status === SubscriptionStatus.ACTIVE ||
          subscription.status === SubscriptionStatus.TRIALING;
        const isStarted = subscription.startsAt <= now;
        const isNotExpired = !subscription.endsAt || subscription.endsAt >= now;

        return isAllowedStatus && isStarted && isNotExpired;
      }) ?? null
    );
  }
}
