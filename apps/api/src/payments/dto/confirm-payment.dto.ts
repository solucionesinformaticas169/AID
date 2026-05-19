import { IsEnum, IsOptional, IsString } from "class-validator";

import { PaymentProviderCode } from "../types/payment.types";

export class ConfirmPaymentDto {
  @IsString()
  subscriptionId!: string;

  @IsString()
  paymentId!: string;

  @IsEnum(PaymentProviderCode)
  provider!: PaymentProviderCode;

  @IsOptional()
  @IsString()
  providerPaymentId?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
