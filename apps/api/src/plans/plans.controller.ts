import { Controller, Get, Post } from "@nestjs/common";

import { Public } from "../common/decorators/public.decorator";
import { PlansService } from "./plans.service";

@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Public()
  @Get()
  getPlans() {
    return this.plansService.getPersistedPlans();
  }

  @Post("sync")
  syncDefaultPlans() {
    return this.plansService.syncDefaultPlans();
  }
}
