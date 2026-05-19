import { Body, Controller, Get, Patch } from "@nestjs/common";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { ROLE_CODES } from "../common/constants/role-codes";
import { UpdateCandidateProfileDto } from "./dto/update-candidate-profile.dto";
import { CandidateService } from "./candidate.service";

@Roles(ROLE_CODES.CANDIDATE)
@Controller("candidate")
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get("dashboard")
  getDashboard(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getDashboard(user.sub);
  }

  @Patch("profile")
  updateProfile(@CurrentUser() user: { sub: string }, @Body() payload: UpdateCandidateProfileDto) {
    return this.candidateService.updateProfile(user.sub, payload);
  }
}
