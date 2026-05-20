import { IsEnum, IsOptional, IsString } from "class-validator";
import { JobApplicationStatus } from "@prisma/client";

import { SanitizeText } from "../../common/validation/sanitizers";

export class UpdateApplicationStatusDto {
  @IsEnum(JobApplicationStatus)
  status!: JobApplicationStatus;

  @IsOptional()
  @SanitizeText()
  @IsString()
  note?: string;
}
