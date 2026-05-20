import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { UploadsController } from "./uploads.controller";
import { UploadsRepository } from "./repositories/uploads.repository";
import { SupabaseStorageService } from "./supabase-storage.service";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [PrismaModule],
  controllers: [UploadsController],
  providers: [UploadsService, UploadsRepository, SupabaseStorageService],
})
export class UploadsModule {}
