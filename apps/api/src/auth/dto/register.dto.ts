import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

import { NormalizeEmail, SanitizeText } from "../../common/validation/sanitizers";

export class RegisterDto {
  @NormalizeEmail()
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @SanitizeText()
  @IsString()
  firstName!: string;

  @SanitizeText()
  @IsString()
  lastName!: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  phone?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  companyName?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  taxId?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  commercialName?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  contactPosition?: string;

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
  @NormalizeEmail()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  roleCode?: string;
}
