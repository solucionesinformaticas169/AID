import { Module } from "@nestjs/common";

import { ObservabilityModule } from "../observability/observability.module";
import { RetentionService } from "./retention.service";

@Module({
  imports: [ObservabilityModule],
  providers: [RetentionService],
})
export class RetentionModule {}

