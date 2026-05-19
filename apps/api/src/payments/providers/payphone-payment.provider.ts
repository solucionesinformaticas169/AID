import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

import type { PaymentCheckoutInput, PaymentCheckoutResult } from "../types/payment.types";

@Injectable()
export class PayphonePaymentProvider {
  constructor(private readonly configService: ConfigService) {}

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
    const token = this.configService.get<string>("PAYPHONE_TOKEN");
    const storeId = this.configService.get<string>("PAYPHONE_STORE_ID");
    const responseUrl =
      this.configService.get<string>("PAYPHONE_RESPONSE_URL") ?? input.successUrl;

    if (!token || !storeId) {
      throw new InternalServerErrorException(
        "PAYPHONE_TOKEN y PAYPHONE_STORE_ID son obligatorios para usar PayPhone.",
      );
    }

    if (!input.payerPhoneNumber || !input.payerCountryCode) {
      throw new InternalServerErrorException(
        "PayPhone requiere payerPhoneNumber y payerCountryCode para iniciar la venta.",
      );
    }

    const payload = {
      amount: Math.round(input.amount * 100),
      amountWithoutTax: Math.round(input.amount * 100),
      clientTransactionId: `${input.companyId}-${Date.now()}`,
      countryCode: input.payerCountryCode,
      currency: input.currency,
      phoneNumber: input.payerPhoneNumber,
      reference: `${input.planName} - ${input.companyId}`,
      responseUrl,
      storeId,
    };

    const response = await fetch("https://pay.payphonetodoesposible.com/api/Sale", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new InternalServerErrorException("No se pudo crear la transaccion con PayPhone.");
    }

    return {
      provider: "PAYPHONE",
      externalReference: String(result.transactionId ?? payload.clientTransactionId),
      providerPaymentId: String(result.transactionId ?? payload.clientTransactionId),
      providerPayload: result,
    };
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string | undefined) {
    const secret = this.configService.get<string>("PAYPHONE_WEBHOOK_SECRET");

    if (!secret || !signature) {
      return false;
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const normalizedProvided = signature.replace(/^sha256=/i, "");

    try {
      return timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(normalizedProvided, "hex"),
      );
    } catch {
      return false;
    }
  }

  async getSaleByTransactionId(transactionId: string) {
    const token = this.configService.get<string>("PAYPHONE_TOKEN");

    if (!token) {
      throw new InternalServerErrorException("PAYPHONE_TOKEN es obligatorio para consultar la transaccion.");
    }

    const response = await fetch(`https://pay.payphonetodoesposible.com/api/Sale/${transactionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException("No se pudo consultar la transaccion en PayPhone.");
    }

    return (await response.json()) as Record<string, unknown>;
  }
}
