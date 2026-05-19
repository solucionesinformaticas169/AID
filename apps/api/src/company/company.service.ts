import { Injectable } from "@nestjs/common";

import { PlansService } from "../plans/plans.service";

@Injectable()
export class CompanyService {
  constructor(private readonly plansService: PlansService) {}

  async getDashboard(companyId: string) {
    const planStatus = await this.plansService.getCompanyPlanStatus(companyId);

    return {
      companyId,
      activePlan: planStatus.activePlan,
      activePlanName: planStatus.activePlanName,
      freePostsRemaining: planStatus.freePostsRemaining,
      freePostsUsed: planStatus.freePostsUsed,
      freePostsIncluded: planStatus.freePostsIncluded,
      canPublish: planStatus.canPublish,
      hasActiveSubscription: planStatus.hasActiveSubscription,
      publicationRule: planStatus.publicationRule,
      vacancies: 0,
      recruiters: 0,
      subscription: planStatus.subscription,
    };
  }

  getPublishingStatus(companyId: string) {
    return this.plansService.getCompanyPlanStatus(companyId);
  }

  syncDefaultPlans() {
    return this.plansService.syncDefaultPlans();
  }
}
