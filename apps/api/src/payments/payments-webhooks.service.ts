import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentProvider, PaymentStatus, Prisma } from "@prisma/client";
import Stripe from "stripe";

import { PayphonePaymentProvider } from "./providers/payphone-payment.provider";
import { PaypalPaymentProvider } from "./providers/paypal-payment.provider";
import { StripePaymentProvider } from "./providers/stripe-payment.provider";
import { PaymentsRepository } from "./repositories/payments.repository";
import { InvoicePdfService } from "./utils/invoice-pdf.service";

type WebhookResponse = {
  received: true;
  provider: PaymentProvider;
  eventType: string;
  status: "processed" | "duplicate" | "ignored";
  message: string;
};

type ReconcileSuccessInput = {
  provider: PaymentProvider;
  eventType: string;
  providerTransactionId: string;
  externalReference?: string | null;
  externalSubscriptionId?: string | null;
  externalCustomerId?: string | null;
  amount?: number | null;
  currency?: string | null;
  receiptUrl?: string | null;
  providerPayload?: Prisma.InputJsonValue;
  paidAt?: Date;
};

@Injectable()
export class PaymentsWebhooksService {
  private readonly logger = new Logger(PaymentsWebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly stripePaymentProvider: StripePaymentProvider,
    private readonly paypalPaymentProvider: PaypalPaymentProvider,
    private readonly payphonePaymentProvider: PayphonePaymentProvider,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  async handleStripeWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
    const webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new BadRequestException("STRIPE_WEBHOOK_SECRET no esta configurado.");
    }

    const signature = this.getHeader(headers, "stripe-signature");
    let event: Stripe.Event;

    try {
      event = this.stripePaymentProvider.constructWebhookEvent(rawBody, signature ?? "", webhookSecret);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Firma invalida para webhook de Stripe.";
      await this.paymentsRepository.createWebhookEvent({
        provider: PaymentProvider.STRIPE,
        eventType: "signature_verification_failed",
        signatureValid: false,
        processingStatus: "REJECTED",
        message,
        payload: this.safeJsonValue(rawBody.toString("utf-8")),
        headers: this.safeJsonValue(this.normalizeHeaders(headers)),
        processedAt: new Date(),
      });
      this.logger.warn(`Stripe webhook rechazado por firma invalida: ${message}`);
      throw new BadRequestException(message);
    }

    const providerTransactionId = this.resolveStripeTransactionId(event);
    const webhookLog = await this.paymentsRepository.createWebhookEvent({
      provider: PaymentProvider.STRIPE,
      providerEventId: event.id,
      providerTransactionId,
      eventType: event.type,
      signatureValid: true,
      processingStatus: "RECEIVED",
      message: "Webhook Stripe recibido.",
      payload: this.safeJsonValue(event as unknown as Record<string, unknown>),
      headers: this.safeJsonValue(this.normalizeHeaders(headers)),
    });

    try {
      const result = await this.processStripeEvent(event);
      await this.paymentsRepository.updateWebhookEvent(webhookLog.id, {
        processingStatus: result.status.toUpperCase(),
        message: result.message,
        processedAt: new Date(),
        signatureValid: true,
      });
      this.logger.log(`Stripe webhook ${event.type} ${result.status}: ${result.message}`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error procesando webhook Stripe.";
      await this.paymentsRepository.updateWebhookEvent(webhookLog.id, {
        processingStatus: "FAILED",
        message,
        processedAt: new Date(),
        signatureValid: true,
      });
      this.logger.error(`Stripe webhook ${event.type} fallo: ${message}`);
      throw error;
    }
  }

  async handlePaypalWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const webhookId = this.paypalPaymentProvider.getConfiguredWebhookId();

    if (!webhookId) {
      throw new BadRequestException("PAYPAL_WEBHOOK_ID no esta configurado.");
    }

    const eventType = String(payload.event_type ?? "unknown");
    const providerEventId = String(payload.id ?? "");
    const providerTransactionId = this.resolvePaypalTransactionId(payload);
    const signatureValid = await this.paypalPaymentProvider.verifyWebhookSignature({
      authAlgo: this.getRequiredHeader(headers, "paypal-auth-algo"),
      certUrl: this.getRequiredHeader(headers, "paypal-cert-url"),
      transmissionId: this.getRequiredHeader(headers, "paypal-transmission-id"),
      transmissionSig: this.getRequiredHeader(headers, "paypal-transmission-sig"),
      transmissionTime: this.getRequiredHeader(headers, "paypal-transmission-time"),
      webhookId,
      webhookEvent: payload,
    });

    const webhookLog = await this.paymentsRepository.createWebhookEvent({
      provider: PaymentProvider.PAYPAL,
      providerEventId,
      providerTransactionId,
      eventType,
      signatureValid,
      processingStatus: signatureValid ? "RECEIVED" : "REJECTED",
      message: signatureValid ? "Webhook PayPal recibido." : "Firma PayPal invalida.",
      payload: this.safeJsonValue(payload),
      headers: this.safeJsonValue(this.normalizeHeaders(headers)),
      processedAt: signatureValid ? null : new Date(),
    });

    if (!signatureValid) {
      this.logger.warn(`PayPal webhook rechazado: firma invalida para evento ${eventType}.`);
      throw new BadRequestException("Firma invalida para webhook de PayPal.");
    }

    try {
      const result = await this.processPaypalEvent(payload);
      await this.paymentsRepository.updateWebhookEvent(webhookLog.id, {
        processingStatus: result.status.toUpperCase(),
        message: result.message,
        processedAt: new Date(),
      });
      this.logger.log(`PayPal webhook ${eventType} ${result.status}: ${result.message}`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error procesando webhook PayPal.";
      await this.paymentsRepository.updateWebhookEvent(webhookLog.id, {
        processingStatus: "FAILED",
        message,
        processedAt: new Date(),
      });
      this.logger.error(`PayPal webhook ${eventType} fallo: ${message}`);
      throw error;
    }
  }

  async handlePayphoneWebhook(
    rawBody: Buffer,
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const signature = this.getHeader(headers, "x-payphone-signature");
    const signatureValid = this.payphonePaymentProvider.verifyWebhookSignature(rawBody, signature);
    const providerTransactionId = this.resolvePayphoneTransactionId(payload);
    const eventType = this.resolvePayphoneEventType(payload);
    const providerEventId = providerTransactionId ?? String(payload.ClientTransactionId ?? payload.clientTransactionId ?? "");

    const webhookLog = await this.paymentsRepository.createWebhookEvent({
      provider: PaymentProvider.PAYPHONE,
      providerEventId,
      providerTransactionId,
      eventType,
      signatureValid,
      processingStatus: signatureValid ? "RECEIVED" : "REJECTED",
      message: signatureValid
        ? "Webhook PayPhone recibido."
        : "Firma PayPhone invalida o PAYPHONE_WEBHOOK_SECRET no configurado.",
      payload: this.safeJsonValue(payload),
      headers: this.safeJsonValue(this.normalizeHeaders(headers)),
      processedAt: signatureValid ? null : new Date(),
    });

    if (!signatureValid) {
      this.logger.warn(`PayPhone webhook rechazado: firma invalida para transaccion ${providerTransactionId ?? "sin-id"}.`);
      throw new BadRequestException("Firma invalida para webhook de PayPhone.");
    }

    try {
      const transactionId = providerTransactionId;

      if (!transactionId) {
        throw new BadRequestException("PayPhone webhook recibido sin TransactionId.");
      }

      const sale = await this.payphonePaymentProvider.getSaleByTransactionId(transactionId);
      const result = await this.processPayphoneEvent(payload, sale, transactionId);
      await this.paymentsRepository.updateWebhookEvent(webhookLog.id, {
        processingStatus: result.status.toUpperCase(),
        message: result.message,
        processedAt: new Date(),
      });
      this.logger.log(`PayPhone webhook ${eventType} ${result.status}: ${result.message}`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error procesando webhook PayPhone.";
      await this.paymentsRepository.updateWebhookEvent(webhookLog.id, {
        processingStatus: "FAILED",
        message,
        processedAt: new Date(),
      });
      this.logger.error(`PayPhone webhook ${eventType} fallo: ${message}`);
      throw error;
    }
  }

  private async processStripeEvent(event: Stripe.Event): Promise<WebhookResponse> {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription") {
          return this.ignored(PaymentProvider.STRIPE, event.type, "Evento Stripe fuera del flujo SaaS.");
        }

        return this.reconcileSuccessfulPayment({
          provider: PaymentProvider.STRIPE,
          eventType: event.type,
          providerTransactionId: session.id,
          externalReference: session.id,
          externalSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
          externalCustomerId:
            typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
          amount: session.amount_total ? session.amount_total / 100 : null,
          currency: session.currency?.toUpperCase() ?? "USD",
          receiptUrl: session.url ?? null,
          providerPayload: event as unknown as Prisma.InputJsonValue,
        });
      }
      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id?: string | null } | null;
          payment_intent?: string | null;
          customer?: string | { id?: string | null } | null;
          hosted_invoice_url?: string | null;
          invoice_pdf?: string | null;
        };
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id ?? null;

        if (!subscriptionId) {
          return this.ignored(PaymentProvider.STRIPE, event.type, "Invoice Stripe sin subscription asociada.");
        }

        const providerTransactionId =
          typeof invoice.payment_intent === "string"
            ? invoice.payment_intent
            : (invoice.id ?? "stripe-invoice-unknown");

        return this.reconcileSuccessfulPayment({
          provider: PaymentProvider.STRIPE,
          eventType: event.type,
          providerTransactionId,
          externalReference: invoice.id,
          externalSubscriptionId: subscriptionId,
          externalCustomerId:
            typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null,
          amount: invoice.amount_paid ? invoice.amount_paid / 100 : invoice.amount_due / 100,
          currency: invoice.currency?.toUpperCase() ?? "USD",
          receiptUrl: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null,
          providerPayload: event as unknown as Prisma.InputJsonValue,
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : new Date(),
        });
      }
      default:
        return this.ignored(PaymentProvider.STRIPE, event.type, "Evento Stripe recibido sin accion de conciliacion.");
    }
  }

  private async processPaypalEvent(payload: Record<string, unknown>): Promise<WebhookResponse> {
    const eventType = String(payload.event_type ?? "unknown");
    const resource = this.getObject(payload.resource);

    switch (eventType) {
      case "PAYMENT.SALE.COMPLETED":
        return this.reconcileSuccessfulPayment({
          provider: PaymentProvider.PAYPAL,
          eventType,
          providerTransactionId: String(resource.id ?? this.resolvePaypalTransactionId(payload) ?? ""),
          externalReference: String(resource.billing_agreement_id ?? resource.id ?? ""),
          externalSubscriptionId: String(resource.billing_agreement_id ?? ""),
          amount: resource.amount ? Number(this.getObject(resource.amount).total ?? 0) : null,
          currency: resource.amount ? String(this.getObject(resource.amount).currency ?? "USD") : "USD",
          receiptUrl: String(resource.receipt_id ?? ""),
          providerPayload: payload as Prisma.InputJsonValue,
          paidAt: resource.create_time ? new Date(String(resource.create_time)) : new Date(),
        });
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const subscriber = this.getObject(resource.subscriber);
        return this.reconcileSuccessfulPayment({
          provider: PaymentProvider.PAYPAL,
          eventType,
          providerTransactionId: String(resource.id ?? this.resolvePaypalTransactionId(payload) ?? ""),
          externalReference: String(resource.id ?? ""),
          externalSubscriptionId: String(resource.id ?? ""),
          externalCustomerId: String(subscriber.payer_id ?? ""),
          providerPayload: payload as Prisma.InputJsonValue,
          paidAt: resource.start_time ? new Date(String(resource.start_time)) : new Date(),
        });
      }
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REVERSED":
      case "PAYMENT.SALE.REFUNDED":
        return this.markFailedPaymentFromWebhook(PaymentProvider.PAYPAL, eventType, payload);
      default:
        return this.ignored(PaymentProvider.PAYPAL, eventType, "Evento PayPal recibido sin accion de conciliacion.");
    }
  }

  private async processPayphoneEvent(
    payload: Record<string, unknown>,
    sale: Record<string, unknown>,
    transactionId: string,
  ): Promise<WebhookResponse> {
    const statusCode = Number(sale.statusCode ?? payload.StatusCode ?? payload.statusCode ?? 0);
    const transactionStatus = String(
      sale.transactionStatus ?? payload.TransactionStatus ?? payload.transactionStatus ?? "Unknown",
    );

    if (statusCode !== 3 || transactionStatus.toLowerCase() !== "approved") {
      return this.markFailedPaymentFromWebhook(PaymentProvider.PAYPHONE, transactionStatus, payload);
    }

    return this.reconcileSuccessfulPayment({
      provider: PaymentProvider.PAYPHONE,
      eventType: this.resolvePayphoneEventType(payload),
      providerTransactionId: transactionId,
      externalReference: String(
        sale.clientTransactionId ?? payload.ClientTransactionId ?? payload.clientTransactionId ?? transactionId,
      ),
      amount: Number(sale.amount ?? payload.Amount ?? payload.amount ?? 0) / 100,
      currency: String(sale.currency ?? payload.Currency ?? payload.currency ?? "USD"),
      receiptUrl: null,
      providerPayload: sale as Prisma.InputJsonValue,
      paidAt: sale.date ? new Date(String(sale.date)) : new Date(),
    });
  }

  private async reconcileSuccessfulPayment(input: ReconcileSuccessInput): Promise<WebhookResponse> {
    if (!input.providerTransactionId) {
      throw new BadRequestException(`Webhook ${input.provider} recibido sin transactionId procesable.`);
    }

    const existingPayment = await this.paymentsRepository.findPaymentByProviderTransaction(
      input.provider,
      input.providerTransactionId,
    );

    if (existingPayment?.status === PaymentStatus.PAID) {
      return this.duplicate(
        input.provider,
        input.eventType,
        `La transaccion ${input.providerTransactionId} ya estaba conciliada.`,
      );
    }

    const subscription =
      (existingPayment
        ? await this.paymentsRepository.findSubscriptionById(existingPayment.subscriptionId)
        : null) ??
      (input.externalSubscriptionId
        ? await this.paymentsRepository.findSubscriptionByExternalReference(
            input.provider,
            input.externalSubscriptionId,
          )
        : null) ??
      (input.externalReference
        ? await this.paymentsRepository.findSubscriptionByExternalReference(
            input.provider,
            input.externalReference,
          )
        : null);

    if (!subscription) {
      throw new NotFoundException(
        `No existe una suscripcion local para conciliar la transaccion ${input.providerTransactionId}.`,
      );
    }

    const pendingPayment =
      existingPayment ??
      subscription.payments.find(
        (payment: { provider: PaymentProvider; status: PaymentStatus }) =>
          payment.provider === input.provider && payment.status === PaymentStatus.PENDING,
      ) ??
      null;

    if (pendingPayment) {
      const invoiceNumber =
        pendingPayment.invoice?.invoiceNumber ??
        this.buildInvoiceNumber(subscription.company.slug, input.provider);
      const invoicePdfPath = await this.invoicePdfService.generateInvoicePdf({
        invoiceNumber,
        companyName: subscription.company.name,
        planName: subscription.plan.name,
        total: input.amount ?? Number(subscription.plan.price),
        currency: input.currency ?? subscription.plan.currency,
        issuedAt: input.paidAt ?? new Date(),
      });

      await this.paymentsRepository.confirmPayment({
        subscriptionId: subscription.id,
        paymentId: pendingPayment.id,
        providerPaymentId: input.providerTransactionId,
        externalReference: input.externalReference ?? pendingPayment.externalReference ?? undefined,
        receiptUrl: input.receiptUrl ?? undefined,
        invoicePdfPath,
        externalSubscriptionId: input.externalSubscriptionId ?? undefined,
        externalCustomerId: input.externalCustomerId ?? undefined,
        paidAt: input.paidAt,
      });

      return {
        received: true,
        provider: input.provider,
        eventType: input.eventType,
        status: "processed",
        message: `Pago pendiente conciliado para la suscripcion ${subscription.id}.`,
      };
    }

    const currentPeriodAnchor =
      subscription.currentPeriodEnd && subscription.currentPeriodEnd > (input.paidAt ?? new Date())
        ? subscription.currentPeriodEnd
        : input.paidAt ?? new Date();
    const renewedPeriodEnd = this.addMonths(currentPeriodAnchor, subscription.plan.durationMonths);

    await this.paymentsRepository.renewSubscriptionWindow({
      subscriptionId: subscription.id,
      startsAt: subscription.startsAt,
      endsAt: renewedPeriodEnd,
      currentPeriodStart: currentPeriodAnchor,
      currentPeriodEnd: renewedPeriodEnd,
      externalSubscriptionId: input.externalSubscriptionId ?? subscription.externalSubscriptionId,
      externalCustomerId: input.externalCustomerId ?? subscription.externalCustomerId,
    });

    const invoiceNumber = this.buildInvoiceNumber(subscription.company.slug, input.provider);
    const invoicePdfPath = await this.invoicePdfService.generateInvoicePdf({
      invoiceNumber,
      companyName: subscription.company.name,
      planName: subscription.plan.name,
      total: input.amount ?? Number(subscription.plan.price),
      currency: input.currency ?? subscription.plan.currency,
      issuedAt: input.paidAt ?? new Date(),
    });

    await this.paymentsRepository.createRenewalPayment({
      subscriptionId: subscription.id,
      provider: input.provider,
      amount: input.amount ?? Number(subscription.plan.price),
      currency: input.currency ?? subscription.plan.currency,
      externalReference: input.externalReference ?? input.externalSubscriptionId ?? input.providerTransactionId,
      providerPaymentId: input.providerTransactionId,
      receiptUrl: input.receiptUrl,
      providerPayload: input.providerPayload,
      invoiceNumber,
      paidAt: input.paidAt ?? new Date(),
      invoicePdfPath,
    });

    return {
      received: true,
      provider: input.provider,
      eventType: input.eventType,
      status: "processed",
      message: `Renovacion aplicada automaticamente para la suscripcion ${subscription.id}.`,
    };
  }

  private async markFailedPaymentFromWebhook(
    provider: PaymentProvider,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookResponse> {
    const transactionId =
      provider === PaymentProvider.PAYPAL
        ? this.resolvePaypalTransactionId(payload)
        : this.resolvePayphoneTransactionId(payload);

    if (!transactionId) {
      return this.ignored(provider, eventType, "Evento de fallo recibido sin transactionId.");
    }

    const payment = await this.paymentsRepository.findPaymentByProviderTransaction(provider, transactionId);

    if (!payment) {
      return this.ignored(provider, eventType, `No existe pago local para la transaccion ${transactionId}.`);
    }

    if (payment.status === PaymentStatus.FAILED) {
      return this.duplicate(provider, eventType, `La transaccion ${transactionId} ya estaba marcada como fallida.`);
    }

    await this.paymentsRepository.markPaymentFailed({
      paymentId: payment.id,
      providerPaymentId: transactionId,
      externalReference: transactionId,
    });

    return {
      received: true,
      provider,
      eventType,
      status: "processed",
      message: `Pago ${transactionId} marcado como fallido.`,
    };
  }

  private resolveStripeTransactionId(event: Stripe.Event) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      return session.id;
    }

    if (event.type === "invoice.payment_succeeded" || event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice & {
        payment_intent?: string | null;
      };
      return typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.id;
    }

    return event.id;
  }

  private resolvePaypalTransactionId(payload: Record<string, unknown>) {
    const resource = this.getObject(payload.resource);
    return (
      this.optionalString(resource.id) ??
      this.optionalString(resource.sale_id) ??
      this.optionalString(resource.billing_agreement_id) ??
      this.optionalString(payload.id)
    );
  }

  private resolvePayphoneTransactionId(payload: Record<string, unknown>) {
    return (
      this.optionalString(payload.TransactionId) ??
      this.optionalString(payload.transactionId) ??
      this.optionalString(payload.id)
    );
  }

  private resolvePayphoneEventType(payload: Record<string, unknown>) {
    return this.optionalString(payload.TransactionStatus) ?? this.optionalString(payload.transactionStatus) ?? "PAYPHONE.NOTIFICATION";
  }

  private buildInvoiceNumber(companySlug: string, provider: PaymentProvider) {
    return `AID-${provider}-${companySlug.toUpperCase()}-${Date.now()}`;
  }

  private addMonths(date: Date, months: number) {
    if (months <= 0) {
      return null;
    }

    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private normalizeHeaders(headers: Record<string, string | string[] | undefined>) {
    return Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : value ?? ""]),
    );
  }

  private getHeader(headers: Record<string, string | string[] | undefined>, name: string) {
    const value = headers[name];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private getRequiredHeader(headers: Record<string, string | string[] | undefined>, name: string) {
    const value = this.getHeader(headers, name);

    if (!value) {
      throw new BadRequestException(`Cabecera requerida ausente: ${name}.`);
    }

    return value;
  }

  private getObject(value: unknown) {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  }

  private optionalString(value: unknown) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }

    return null;
  }

  private safeJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }

  private ignored(provider: PaymentProvider, eventType: string, message: string): WebhookResponse {
    return {
      received: true,
      provider,
      eventType,
      status: "ignored",
      message,
    };
  }

  private duplicate(provider: PaymentProvider, eventType: string, message: string): WebhookResponse {
    return {
      received: true,
      provider,
      eventType,
      status: "duplicate",
      message,
    };
  }
}
