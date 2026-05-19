import { IsEnum, IsOptional, IsString } from "class-validator";
import { JobApplicationStatus } from "@prisma/client";

export class UpdateApplicationStatusDto {
  @IsEnum(JobApplicationStatus)
  status!: JobApplicationStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
