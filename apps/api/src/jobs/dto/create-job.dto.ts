import { IsOptional, IsString } from "class-validator";
import { IsArray, IsInt, Min } from "class-validator";

export class CreateJobDto {
  @IsString()
  companyId!: string;

  @IsString()
  createdByUserId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  requiredEducationLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumYearsExperience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredLanguages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredCertifications?: string[];
}
