import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

import type { PaymentCheckoutInput, PaymentCheckoutResult } from "../types/payment.types";

type PayphoneButtonPrepareResponse = {
  paymentId?: string;
  payWithPayPhone?: string;
  payWithCard?: string;
};

@Injectable()
export class PayphonePaymentProvider {
  constructor(private readonly configService: ConfigService) {}

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
    const token = this.configService.get<string>("PAYPHONE_TOKEN");
    const storeId = this.configService.get<string>("PAYPHONE_STORE_ID");

    if (!token || !storeId) {
      throw new InternalServerErrorException(
        "PAYPHONE_TOKEN y PAYPHONE_STORE_ID son obligatorios para usar PayPhone.",
      );
    }

    const clientTransactionId = `${input.companyId}-${Date.now()}`;
    const amount = Math.round(input.amount * 100);
    const payload = {
      amount,
      amountWithoutTax: amount,
      amountWithTax: 0,
      tax: 0,
      service: 0,
      tip: 0,
      currency: input.currency,
      clientTransactionId,
      reference: `${input.planName} - ${input.companyId}`,
      storeId,
      responseUrl: input.successUrl,
      cancellationUrl: input.cancelUrl,
      order: {
        billTo: {
          address1: input.billingAddress ?? undefined,
          locality: input.billingCity ?? undefined,
          country: this.resolvePayphoneCountryCode(input.billingCountry),
          firstName: input.billingFirstName ?? undefined,
          lastName: input.billingLastName ?? undefined,
          phoneNumber: this.formatPhoneNumber(
            input.payerCountryCode,
            input.payerPhoneNumber ?? input.billingContactPhone,
          ),
          email: input.customerEmail ?? undefined,
          document: input.billingTaxId ?? undefined,
        },
      },
    };

    const response = await fetch("https://pay.payphonetodoesposible.com/api/button/Prepare", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as PayphoneButtonPrepareResponse & Record<string, unknown>;

    if (!response.ok) {
      throw new InternalServerErrorException("No se pudo preparar el checkout con PayPhone.");
    }

    return {
      provider: "PAYPHONE",
      externalReference: clientTransactionId,
      providerPaymentId: result.paymentId ?? clientTransactionId,
      checkoutUrl: result.payWithCard ?? result.payWithPayPhone ?? null,
      providerPayload: result,
    };
  }

  async confirmButtonTransaction(id: number, clientTxId: string) {
    const token = this.configService.get<string>("PAYPHONE_TOKEN");

    if (!token) {
      throw new InternalServerErrorException("PAYPHONE_TOKEN es obligatorio para confirmar pagos PayPhone.");
    }

    const response = await fetch("https://pay.payphonetodoesposible.com/api/button/V2/Confirm", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        clientTxId,
      }),
    });

    const result = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new InternalServerErrorException(
        typeof result.message === "string"
          ? result.message
          : "No se pudo confirmar la transaccion con PayPhone.",
      );
    }

    return result;
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

  private formatPhoneNumber(countryCode?: string, phoneNumber?: string) {
    if (!phoneNumber) {
      return undefined;
    }

    const normalizedCountryCode = (countryCode ?? "").replace(/\D/g, "");
    const normalizedPhone = phoneNumber.replace(/\D/g, "");

    if (!normalizedCountryCode) {
      return normalizedPhone;
    }

    if (normalizedPhone.startsWith(normalizedCountryCode)) {
      return `+${normalizedPhone}`;
    }

    return `+${normalizedCountryCode}${normalizedPhone}`;
  }

  private resolvePayphoneCountryCode(country?: string) {
    if (!country) {
      return "EC";
    }

    const normalized = country.trim().toLowerCase();

    if (normalized === "ecuador") {
      return "EC";
    }

    return country.trim().toUpperCase().slice(0, 2);
  }
}
