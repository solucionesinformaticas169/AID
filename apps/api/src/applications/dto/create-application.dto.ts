import { IsArray, IsOptional, IsString } from "class-validator";

import {
  SanitizeStringArray,
  SanitizeText,
} from "../../common/validation/sanitizers";

export class CreateApplicationDto {
  @SanitizeText()
  @IsString()
  jobOfferId!: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  coverLetter?: string;

  @IsArray()
  @SanitizeStringArray()
  @IsString({ each: true })
  selectedEducationIds!: string[];

  @IsArray()
  @SanitizeStringArray()
  @IsString({ each: true })
  selectedWorkExperienceIds!: string[];

  @IsArray()
  @SanitizeStringArray()
  @IsString({ each: true })
  selectedCertificationIds!: string[];
}
