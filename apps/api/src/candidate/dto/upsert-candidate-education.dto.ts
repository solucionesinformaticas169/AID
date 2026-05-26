import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpsertCandidateEducationDto {
  @IsOptional()
  @IsString()
  level?: string;

  @IsString()
  institution!: string;

  @IsString()
  degree!: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsOptional()
  @IsString()
  studyTimeValue?: string;

  @IsOptional()
  @IsString()
  studyTimeUnit?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  graduationYear?: number;

  @IsOptional()
  @IsString()
  senescytNumber?: string;
}
