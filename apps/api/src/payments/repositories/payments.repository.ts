import { Injectable } from "@nestjs/common";
import {
  InvoiceStatus,
  PaymentProvider,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCompany(companyId: string) {
    return this.prisma.payment.findMany({
      where: {
        subscription: {
          companyId,
        },
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        invoice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findInvoicesByCompany(companyId: string) {
    return this.prisma.billingInvoice.findMany({
      where: {
        subscription: {
          companyId,
        },
      },
      include: {
        plan: true,
        payment: true,
      },
      orderBy: {
        issuedAt: "desc",
      },
    });
  }

  findCompanyWithActiveSubscription(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  userHasCompanyAccess(userId: string, companyId: string) {
    return this.prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });
  }

  findSubscriptionByExternalReference(provider: PaymentProvider, externalReference: string) {
    return this.prisma.subscription.findFirst({
      where: {
        provider,
        OR: [
          { externalSubscriptionId: externalReference },
          { payments: { some: { externalReference } } },
          { payments: { some: { providerPaymentId: externalReference } } },
        ],
      },
      include: {
        company: true,
        plan: true,
        payments: {
          include: {
            invoice: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  findSubscriptionById(subscriptionId: string) {
    return this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        company: true,
        plan: true,
        payments: {
          include: {
            invoice: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  findPaymentByProviderTransaction(provider: PaymentProvider, transactionId: string) {
    return this.prisma.payment.findFirst({
      where: {
        provider,
        OR: [{ providerPaymentId: transactionId }, { externalReference: transactionId }],
      },
      include: {
        subscription: {
          include: {
            company: true,
            plan: true,
          },
        },
        invoice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  createWebhookEvent(input: {
    provider: PaymentProvider;
    providerEventId?: string | null;
    providerTransactionId?: string | null;
    eventType: string;
    signatureValid: boolean;
    processingStatus: string;
    message?: string | null;
    payload: Prisma.InputJsonValue;
    headers?: Prisma.InputJsonValue;
    paymentId?: string | null;
    processedAt?: Date | null;
  }) {
    return this.prisma.paymentWebhookEvent.create({
      data: {
        provider: input.provider,
        providerEventId: input.providerEventId,
        providerTransactionId: input.providerTransactionId,
        eventType: input.eventType,
        signatureValid: input.signatureValid,
        processingStatus: input.processingStatus,
        message: input.message,
        payload: input.payload,
        headers: input.headers,
        paymentId: input.paymentId,
        processedAt: input.processedAt,
      },
    });
  }

  updateWebhookEvent(
    webhookEventId: string,
    input: {
      processingStatus: string;
      message?: string | null;
      paymentId?: string | null;
      processedAt?: Date | null;
      signatureValid?: boolean;
    },
  ) {
    return this.prisma.paymentWebhookEvent.update({
      where: { id: webhookEventId },
      data: {
        processingStatus: input.processingStatus,
        message: input.message,
        paymentId: input.paymentId,
        processedAt: input.processedAt,
        signatureValid: input.signatureValid,
      },
    });
  }

  async createCheckoutRecords(input: {
    companyId: string;
    planId: string;
    provider: PaymentProvider;
    amount: number;
    currency: string;
    externalReference: string;
    checkoutUrl?: string | null;
    providerPaymentId?: string | null;
    providerPayload?: Prisma.InputJsonValue;
    durationMonths: number;
    planSnapshot: Prisma.InputJsonValue;
    invoiceNumber: string;
  }) {
    const now = new Date();
    const endsAt =
      input.durationMonths > 0
        ? new Date(new Date(now).setMonth(new Date(now).getMonth() + input.durationMonths))
        : null;

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          companyId: input.companyId,
          planId: input.planId,
          provider: input.provider,
          externalSubscriptionId: input.externalReference,
          startsAt: now,
          endsAt,
          currentPeriodStart: now,
          currentPeriodEnd: endsAt,
          status: SubscriptionStatus.PAST_DUE,
          autoRenew: true,
          planSnapshot: input.planSnapshot,
        },
      });

      const payment = await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          provider: input.provider,
          amount: input.amount,
          currency: input.currency,
          status: PaymentStatus.PENDING,
          method: "CARD",
          externalReference: input.externalReference,
          providerPaymentId: input.providerPaymentId,
          checkoutUrl: input.checkoutUrl,
          providerPayload: input.providerPayload,
        },
      });

      const invoice = await tx.billingInvoice.create({
        data: {
          subscriptionId: subscription.id,
          planId: input.planId,
          paymentId: payment.id,
          provider: input.provider,
          invoiceNumber: input.invoiceNumber,
          subtotal: input.amount,
          total: input.amount,
          currency: input.currency,
          providerPayload: input.providerPayload,
        },
      });

      return {
        subscriptionId: subscription.id,
        paymentId: payment.id,
        invoiceId: invoice.id,
      };
    });
  }

  findPaymentGraph(subscriptionId: string, paymentId: string) {
    return this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        company: true,
        plan: true,
        payments: {
          where: { id: paymentId },
          include: {
            invoice: true,
          },
        },
      },
    });
  }

  confirmPayment(input: {
    subscriptionId: string;
    paymentId: string;
    providerPaymentId?: string;
    externalReference?: string;
    receiptUrl?: string;
    invoicePdfPath?: string | null;
    externalSubscriptionId?: string;
    externalCustomerId?: string;
    paidAt?: Date;
  }) {
    const now = input.paidAt ?? new Date();

    return this.prisma.subscription.update({
      where: { id: input.subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        externalSubscriptionId: input.externalSubscriptionId,
        externalCustomerId: input.externalCustomerId,
        payments: {
          update: {
            where: { id: input.paymentId },
            data: {
              status: PaymentStatus.PAID,
              paidAt: now,
              providerPaymentId: input.providerPaymentId,
              externalReference: input.externalReference,
              receiptUrl: input.receiptUrl,
              invoice: {
                update: {
                  status: "PAID",
                  paidAt: now,
                  invoicePdfPath: input.invoicePdfPath,
                  invoiceUrl: input.receiptUrl,
                },
              },
            },
          },
        },
      },
      include: {
        plan: true,
        payments: {
          include: {
            invoice: true,
          },
        },
      },
    });
  }

  markPaymentFailed(input: {
    paymentId: string;
    receiptUrl?: string;
    providerPaymentId?: string;
    externalReference?: string;
  }) {
    return this.prisma.payment.update({
      where: { id: input.paymentId },
      data: {
        status: PaymentStatus.FAILED,
        receiptUrl: input.receiptUrl,
        providerPaymentId: input.providerPaymentId,
        externalReference: input.externalReference,
        invoice: {
          update: {
            status: InvoiceStatus.FAILED,
          },
        },
      },
      include: {
        invoice: true,
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async createRenewalPayment(input: {
    subscriptionId: string;
    provider: PaymentProvider;
    amount: number;
    currency: string;
    method?: PaymentMethod;
    externalReference?: string | null;
    providerPaymentId?: string | null;
    receiptUrl?: string | null;
    providerPayload?: Prisma.InputJsonValue;
    invoiceNumber: string;
    paidAt: Date;
    invoicePdfPath?: string | null;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          subscriptionId: input.subscriptionId,
          provider: input.provider,
          amount: input.amount,
          currency: input.currency,
          status: PaymentStatus.PAID,
          method: input.method ?? PaymentMethod.CARD,
          externalReference: input.externalReference,
          providerPaymentId: input.providerPaymentId,
          receiptUrl: input.receiptUrl,
          providerPayload: input.providerPayload,
          paidAt: input.paidAt,
        },
      });

      const invoice = await tx.billingInvoice.create({
        data: {
          subscriptionId: input.subscriptionId,
          planId: (
            await tx.subscription.findUniqueOrThrow({
              where: { id: input.subscriptionId },
              select: { planId: true },
            })
          ).planId,
          paymentId: payment.id,
          provider: input.provider,
          status: InvoiceStatus.PAID,
          invoiceNumber: input.invoiceNumber,
          subtotal: input.amount,
          total: input.amount,
          currency: input.currency,
          invoiceUrl: input.receiptUrl,
          invoicePdfPath: input.invoicePdfPath,
          paidAt: input.paidAt,
          providerPayload: input.providerPayload,
        },
      });

      return { payment, invoice };
    });
  }

  renewSubscriptionWindow(input: {
    subscriptionId: string;
    startsAt: Date;
    endsAt: Date | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    externalSubscriptionId?: string | null;
    externalCustomerId?: string | null;
  }) {
    return this.prisma.subscription.update({
      where: { id: input.subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        currentPeriodStart: input.currentPeriodStart,
        currentPeriodEnd: input.currentPeriodEnd,
        externalSubscriptionId: input.externalSubscriptionId,
        externalCustomerId: input.externalCustomerId,
      },
      include: {
        plan: true,
        payments: {
          include: {
            invoice: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  findInvoiceById(invoiceId: string) {
    return this.prisma.billingInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: {
          include: {
            company: true,
          },
        },
        plan: true,
        payment: true,
      },
    });
  }
}
