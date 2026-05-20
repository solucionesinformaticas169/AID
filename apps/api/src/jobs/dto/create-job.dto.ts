import { IsOptional, IsString } from "class-validator";
import { IsArray, IsInt, Min } from "class-validator";

import {
  SanitizeStringArray,
  SanitizeText,
} from "../../common/validation/sanitizers";

export class CreateJobDto {
  @IsOptional()
  @SanitizeText()
  @IsString()
  companyId?: string;

  @SanitizeText()
  @IsString()
  title!: string;

  @SanitizeText()
  @IsString()
  description!: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  requirements?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  benefits?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  city?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  country?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  requiredEducationLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumYearsExperience?: number;

  @IsOptional()
  @IsArray()
  @SanitizeStringArray()
  @IsString({ each: true })
  requiredLanguages?: string[];

  @IsOptional()
  @IsArray()
  @SanitizeStringArray()
  @IsString({ each: true })
  requiredCertifications?: string[];
}
