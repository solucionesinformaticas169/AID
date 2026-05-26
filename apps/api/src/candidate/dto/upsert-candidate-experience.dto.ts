import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

const BOOLEAN_SELECTIONS = ["SI", "NO"] as const;

export class UpsertCandidateExperienceDto {
  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsNotEmpty()
  position!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  contractType?: string;

  @IsOptional()
  @IsString()
  workday?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(BOOLEAN_SELECTIONS)
  currentlyWorking?: string;

  @IsString()
  @IsNotEmpty()
  responsibilities!: string;

  @IsOptional()
  @IsString()
  achievements?: string;

  @IsOptional()
  @IsString()
  exitReason?: string;
}
