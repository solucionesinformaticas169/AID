import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { PaymentCheckoutInput, PaymentCheckoutResult } from "../types/payment.types";

@Injectable()
export class PaypalPaymentProvider {
  constructor(private readonly configService: ConfigService) {}

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
    const planId = this.getPlanId(input.planCode);

    if (!planId) {
      throw new InternalServerErrorException(
        `No existe PAYPAL_PLAN_ID configurado para el plan ${input.planCode}.`,
      );
    }

    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.getBaseUrl()}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: input.customerEmail
          ? {
              email_address: input.customerEmail,
            }
          : undefined,
        application_context: {
          brand_name: "AIDLABORAL S.A.S.",
          user_action: "SUBSCRIBE_NOW",
          return_url: input.successUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });

    const result = (await response.json()) as {
      id?: string;
      status?: string;
      links?: Array<{ rel?: string; href?: string }>;
    };

    if (!response.ok) {
      throw new InternalServerErrorException("No se pudo crear la suscripcion con PayPal.");
    }

    const approvalLink = result.links?.find((link) => link.rel === "approve");

    return {
      provider: "PAYPAL",
      externalReference: result.id ?? `paypal-${input.companyId}-${Date.now()}`,
      checkoutUrl: approvalLink?.href,
      providerPayload: {
        subscriptionId: result.id,
        status: result.status,
      },
    };
  }

  async verifyWebhookSignature(input: {
    authAlgo: string;
    certUrl: string;
    transmissionId: string;
    transmissionSig: string;
    transmissionTime: string;
    webhookId: string;
    webhookEvent: Record<string, unknown>;
  }) {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: input.authAlgo,
        cert_url: input.certUrl,
        transmission_id: input.transmissionId,
        transmission_sig: input.transmissionSig,
        transmission_time: input.transmissionTime,
        webhook_id: input.webhookId,
        webhook_event: input.webhookEvent,
      }),
    });

    const result = (await response.json()) as { verification_status?: string };

    if (!response.ok) {
      throw new InternalServerErrorException("No se pudo verificar la firma del webhook de PayPal.");
    }

    return result.verification_status === "SUCCESS";
  }

  getConfiguredWebhookId() {
    return this.configService.get<string>("PAYPAL_WEBHOOK_ID");
  }

  private async getAccessToken() {
    const clientId = this.configService.get<string>("PAYPAL_CLIENT_ID");
    const clientSecret = this.configService.get<string>("PAYPAL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        "PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET son obligatorios.",
      );
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const result = (await response.json()) as { access_token?: string };

    if (!response.ok || !result.access_token) {
      throw new InternalServerErrorException("No se pudo autenticar con PayPal.");
    }

    return result.access_token;
  }

  private getBaseUrl() {
    return this.configService.get<string>("PAYPAL_ENVIRONMENT") === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  }

  private getPlanId(planCode: PaymentCheckoutInput["planCode"]) {
    const envMap: Record<PaymentCheckoutInput["planCode"], string | undefined> = {
      FREE: undefined,
      PROFESSIONAL: this.configService.get<string>("PAYPAL_PLAN_ID_PROFESSIONAL"),
      ENTERPRISE: this.configService.get<string>("PAYPAL_PLAN_ID_ENTERPRISE"),
    };

    return envMap[planCode];
  }
}
