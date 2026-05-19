import { Injectable } from "@nestjs/common";

import { UpdateCandidateProfileDto } from "./dto/update-candidate-profile.dto";
import { CandidateRepository } from "./repositories/candidate.repository";

@Injectable()
export class CandidateService {
  constructor(private readonly candidateRepository: CandidateRepository) {}

  async getDashboard(userId: string) {
    const profile = await this.candidateRepository.findProfileByUserId(userId);

    return {
      profile,
      stats: {
        documents: profile?.documents.length ?? 0,
        applications: profile?.applications.length ?? 0,
      },
    };
  }

  updateProfile(userId: string, payload: UpdateCandidateProfileDto) {
    return this.candidateRepository.upsertProfile(userId, payload);
  }
}
