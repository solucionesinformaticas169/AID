import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { CandidateController } from "./candidate.controller";
import { CandidateService } from "./candidate.service";
import { CandidateRepository } from "./repositories/candidate.repository";

@Module({
  imports: [PrismaModule],
  controllers: [CandidateController],
  providers: [CandidateService, CandidateRepository],
})
export class CandidateModule {}
