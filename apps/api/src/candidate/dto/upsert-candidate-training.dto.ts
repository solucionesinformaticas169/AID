import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpsertCandidateTrainingDto {
  @IsString()
  @IsNotEmpty()
  institution!: string;

  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsString()
  @IsNotEmpty()
  eventName!: string;

  @IsString()
  @IsNotEmpty()
  studyArea!: string;

  @IsString()
  @IsNotEmpty()
  certificationType!: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  totalDays?: string;

  @IsOptional()
  @IsString()
  totalHours?: string;
}
