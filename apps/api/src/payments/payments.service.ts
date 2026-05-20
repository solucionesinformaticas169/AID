import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaymentProvider, PlanCode, Prisma } from "@prisma/client";
import { readFile } from "node:fs/promises";

import { AUDIT_ENTITY_TYPES } from "../audit/audit.constants";
import { PlansService } from "../plans/plans.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { StripePaymentProvider } from "./providers/stripe-payment.provider";
import { PaypalPaymentProvider } from "./providers/paypal-payment.provider";
import { PayphonePaymentProvider } from "./providers/payphone-payment.provider";
import { PaymentsRepository } from "./repositories/payments.repository";
import type { PaymentCheckoutResult } from "./types/payment.types";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { ROLE_CODES } from "../common/constants/role-codes";
import { AppLoggerService } from "../observability/app-logger.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly plansService: PlansService,
    private readonly stripePaymentProvider: StripePaymentProvider,
    private readonly paypalPaymentProvider: PaypalPaymentProvider,
    private readonly payphonePaymentProvider: PayphonePaymentProvider,
    private readonly logger: AppLoggerService,
  ) {}

  async getCompanyPayments(user: AuthenticatedUser, companyId: string) {
    await this.assertCompanyBillingAccess(user, companyId);
    return this.paymentsRepository.findByCompany(companyId);
  }

  async getCompanyInvoices(user: AuthenticatedUser, companyId: string) {
    await this.assertCompanyBillingAccess(user, companyId);
    return this.paymentsRepository.findInvoicesByCompany(companyId);
  }

  async getCompanyBillingSummary(user: AuthenticatedUser, companyId: string) {
    await this.assertCompanyBillingAccess(user, companyId);
    const [planStatus, payments, invoices] = await Promise.all([
      this.plansService.getCompanyPlanStatus(companyId),
      this.paymentsRepository.findByCompany(companyId),
      this.paymentsRepository.findInvoicesByCompany(companyId),
    ]);

    return {
      planStatus,
      payments,
      invoices,
    };
  }

  async createCheckoutSession(user: AuthenticatedUser, payload: CreateCheckoutDto) {
    const companyId = await this.resolveAuthorizedCompanyId(user, payload.companyId);
    const company = await this.paymentsRepository.findCompanyWithActiveSubscription(companyId);

    if (!company) {
      throw new NotFoundException(`Empresa ${companyId} no encontrada.`);
    }

    if (payload.planCode === PlanCode.FREE) {
      throw new BadRequestException("El plan Gratis no requiere checkout externo.");
    }

    const plan = await this.plansService.getPlanByCode(payload.planCode);
    const checkoutInput = {
      companyId: company.id,
      planCode: payload.planCode,
      planName: plan.name,
      amount: Number(plan.price),
      currency: plan.currency,
      successUrl: payload.successUrl ?? "http://localhost:3000/empresa?billing=success",
      cancelUrl: payload.cancelUrl ?? "http://localhost:3000/empresa?billing=cancel",
      customerEmail: payload.customerEmail ?? company.billingEmail ?? undefined,
      payerPhoneNumber: payload.payerPhoneNumber,
      payerCountryCode: payload.payerCountryCode,
    } as const;

    const providerResult = await this.runProviderCheckout(payload.provider, checkoutInput);
    const invoiceNumber = this.buildInvoiceNumber(company.slug);
    const checkoutRecords = await this.paymentsRepository.createCheckoutRecords({
      companyId: company.id,
      planId: plan.id,
      provider: payload.provider as PaymentProvider,
      amount: Number(plan.price),
      currency: plan.currency,
      externalReference: providerResult.externalReference,
      checkoutUrl: providerResult.checkoutUrl,
      providerPaymentId: providerResult.providerPaymentId,
      providerPayload: providerResult.providerPayload as Prisma.InputJsonValue | undefined,
      durationMonths: plan.durationMonths,
      planSnapshot: {
        code: plan.code,
        name: plan.name,
        jobPostLimit: plan.jobPostLimit,
        priorityPublication: plan.priorityPublication,
        advancedMetrics: plan.advancedMetrics,
        featuredCandidates: plan.featuredCandidates,
      },
      invoiceNumber,
    });
    this.logger.info("Payment checkout created", {
      context: PaymentsService.name,
      event: "PAYMENT_CHECKOUT_CREATED",
      userId: user.sub,
      companyId: company.id,
      entityType: AUDIT_ENTITY_TYPES.PAYMENT,
      entityId: checkoutRecords.paymentId,
      provider: payload.provider,
      planCode: payload.planCode,
      subscriptionId: checkoutRecords.subscriptionId,
      invoiceId: checkoutRecords.invoiceId,
    });

    return {
      message: `Checkout ${payload.provider} creado correctamente.`,
      checkout: providerResult,
      subscriptionId: checkoutRecords.subscriptionId,
      paymentId: checkoutRecords.paymentId,
      invoiceId: checkoutRecords.invoiceId,
      plan,
    };
  }

  async confirmPayment(payload: ConfirmPaymentDto) {
    throw new ForbiddenException(
      "La confirmacion manual de pagos desde frontend esta deshabilitada. Usa webhooks firmados del proveedor.",
    );
  }

  async getInvoicePdf(user: AuthenticatedUser, invoiceId: string) {
    const invoice = await this.paymentsRepository.findInvoiceById(invoiceId);

    if (!invoice?.invoicePdfPath) {
      throw new NotFoundException(`No existe PDF generado para la factura ${invoiceId}.`);
    }

    await this.assertCompanyBillingAccess(user, invoice.subscription.company.id);

    return {
      invoice,
      file: await readFile(invoice.invoicePdfPath),
    };
  }

  private async runProviderCheckout(
    provider: CreateCheckoutDto["provider"],
    input: Parameters<StripePaymentProvider["createCheckout"]>[0],
  ): Promise<PaymentCheckoutResult> {
    switch (provider) {
      case "STRIPE":
        return this.stripePaymentProvider.createCheckout(input);
      case "PAYPAL":
        return this.paypalPaymentProvider.createCheckout(input);
      case "PAYPHONE":
        return this.payphonePaymentProvider.createCheckout(input);
      default:
        throw new BadRequestException(`Proveedor ${provider} no soportado.`);
    }
  }

  private buildInvoiceNumber(companySlug: string) {
    return `AID-${companySlug.toUpperCase()}-${Date.now()}`;
  }

  private async assertCompanyBillingAccess(user: AuthenticatedUser, companyId: string) {
    if (user.role === ROLE_CODES.SYSTEM_ADMIN) {
      return;
    }

    if (user.role !== ROLE_CODES.COMPANY_ADMIN && user.role !== ROLE_CODES.RECRUITER) {
      throw new ForbiddenException("No tienes permisos para consultar billing empresarial.");
    }

    if (user.companyId && user.companyId !== companyId) {
      throw new ForbiddenException("No puedes acceder al billing de otra empresa.");
    }

    const membership = await this.paymentsRepository.userHasCompanyAccess(user.sub, companyId);

    if (!membership) {
      throw new ForbiddenException("No tienes acceso activo a esta empresa.");
    }
  }

  private async resolveAuthorizedCompanyId(user: AuthenticatedUser, requestedCompanyId: string) {
    await this.assertCompanyBillingAccess(user, requestedCompanyId);
    return requestedCompanyId;
  }
}
