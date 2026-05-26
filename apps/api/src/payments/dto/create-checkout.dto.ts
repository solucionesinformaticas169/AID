import { PlanCode } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

import { PaymentProviderCode } from "../types/payment.types";

export class CreateCheckoutDto {
  @IsString()
  companyId!: string;

  @IsEnum(PlanCode)
  planCode!: PlanCode;

  @IsEnum(PaymentProviderCode)
  provider!: PaymentProviderCode;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  payerPhoneNumber?: string;

  @IsOptional()
  @IsString()
  payerCountryCode?: string;

  @IsOptional()
  @IsString()
  billingFirstName?: string;

  @IsOptional()
  @IsString()
  billingLastName?: string;

  @IsOptional()
  @IsString()
  billingCompanyName?: string;

  @IsOptional()
  @IsString()
  billingContactPhone?: string;

  @IsOptional()
  @IsString()
  billingTaxId?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  billingCity?: string;

  @IsOptional()
  @IsString()
  billingCountry?: string;
}
