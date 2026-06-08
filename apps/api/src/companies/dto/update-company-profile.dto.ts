import { IsEmail, IsOptional, IsString } from "class-validator";

import { NormalizeEmail, SanitizeText } from "../../common/validation/sanitizers";

export class UpdateCompanyProfileDto {
  @IsOptional()
  @SanitizeText()
  @IsString()
  name?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  commercialName?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  taxId?: string;

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
  address?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  website?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  industry?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  contactPosition?: string;

  @IsOptional()
  @NormalizeEmail()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  firstName?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  lastName?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  phone?: string;
}
