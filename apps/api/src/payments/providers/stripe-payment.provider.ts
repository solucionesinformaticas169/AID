import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import type { PaymentCheckoutInput, PaymentCheckoutResult } from "../types/payment.types";

@Injectable()
export class StripePaymentProvider {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY");

    if (!secretKey) {
      this.stripe = new Stripe("sk_test_placeholder", {
        apiVersion: "2025-08-27.basil",
      });
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
    });
  }

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
    const priceId = this.getPriceId(input.planCode);

    if (!priceId) {
      throw new InternalServerErrorException(
        `No existe STRIPE_PRICE_ID configurado para el plan ${input.planCode}.`,
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: input.companyId,
      customer_email: input.customerEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        companyId: input.companyId,
        planCode: input.planCode,
      },
    });

    return {
      provider: "STRIPE",
      externalReference: session.id,
      checkoutUrl: session.url,
      providerPayload: {
        sessionId: session.id,
        status: session.status,
        url: session.url,
      },
    };
  }

  constructWebhookEvent(rawBody: Buffer | string, signature: string, webhookSecret: string) {
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  private getPriceId(planCode: PaymentCheckoutInput["planCode"]) {
    const envMap: Record<PaymentCheckoutInput["planCode"], string | undefined> = {
      FREE: undefined,
      PROFESSIONAL: this.configService.get<string>("STRIPE_PRICE_ID_PROFESSIONAL"),
      ENTERPRISE: this.configService.get<string>("STRIPE_PRICE_ID_ENTERPRISE"),
    };

    return envMap[planCode];
  }
}
