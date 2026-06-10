import { Module } from "@nestjs/common";

import { CandidateModule } from "../candidate/candidate.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UploadsController } from "./uploads.controller";
import { UploadsRepository } from "./repositories/uploads.repository";
import { SupabaseStorageService } from "./supabase-storage.service";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [PrismaModule, CandidateModule],
  controllers: [UploadsController],
  providers: [UploadsService, UploadsRepository, SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class UploadsModule {}
