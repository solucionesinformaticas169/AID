import { Injectable } from "@nestjs/common";
import { AuditAction, PaymentStatus, PlanCode, SubscriptionStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { ListEmailDeliveriesDto } from "../dto/list-email-deliveries.dto";

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  listEmailDeliveries(filters: ListEmailDeliveriesDto) {
    return this.prisma.emailDeliveryLog.findMany({
      where: {
        recipientEmail: filters.recipientEmail,
        templateKind: filters.templateKind,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: filters.limit ?? 20,
      select: {
        id: true,
        recipientEmail: true,
        templateKind: true,
        subject: true,
        provider: true,
        providerEmailId: true,
        status: true,
        errorMessage: true,
        metadata: true,
        sentAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteUsersByEmails(emails: string[]) {
    if (emails.length === 0) {
      return {
        deletedUsers: 0,
        deletedCompanies: 0,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: {
          email: {
            in: emails,
          },
        },
        select: {
          id: true,
          email: true,
          companyUsers: {
            select: {
              companyId: true,
            },
          },
        },
      });

      const companyIds = Array.from(
        new Set(users.flatMap((user) => user.companyUsers.map((companyUser) => companyUser.companyId))),
      );

      let deletedCompanies = 0;

      if (companyIds.length > 0) {
        const deletedCompanyResult = await tx.company.deleteMany({
          where: {
            id: {
              in: companyIds,
            },
          },
        });

        deletedCompanies = deletedCompanyResult.count;
      }

      const deletedUserResult = await tx.user.deleteMany({
        where: {
          email: {
            in: users.map((user) => user.email),
          },
        },
      });

      return {
        deletedUsers: deletedUserResult.count,
        deletedCompanies,
      };
    });
  }

  async getDashboard() {
    const [companies, users, jobs, pendingCompanies] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.jobOffer.count(),
      this.prisma.company.count({
        where: {
          status: "PENDING",
        },
      }),
    ]);

    return {
      companies,
      users,
      jobs,
      pendingCompanies,
    };
  }

  async getConsoleData() {
    const now = new Date();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      usersRegistered,
      companiesRegistered,
      jobsPublished,
      applicationsCount,
      paidPaymentsCount,
      activePlansCount,
      uploadedDocumentsCount,
      lockedAttemptsCount,
      reusedSessionsCount,
      recentFailedLoginsCount,
      users,
      companies,
      jobs,
      applications,
      payments,
      invoices,
      documents,
      auditPreview,
      lockedAttempts,
      reusedSessions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.company.count(),
      this.prisma.jobOffer.count({ where: { status: "PUBLISHED" } }),
      this.prisma.jobApplication.count(),
      this.prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
      this.prisma.subscription.count({
        where: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
      }),
      this.prisma.candidateDocument.count(),
      this.prisma.loginThrottle.count({
        where: {
          lockedUntil: {
            gt: now,
          },
        },
      }),
      this.prisma.userSession.count({
        where: {
          reuseDetectedAt: {
            not: null,
          },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: AuditAction.AUTH_LOGIN_FAILED,
          createdAt: {
            gte: last24Hours,
          },
        },
      }),
      this.prisma.user.findMany({
        include: {
          primaryRole: true,
          companyUsers: {
            where: { isActive: true },
            include: { company: true },
          },
          sessions: {
            where: {
              revokedAt: null,
              expiresAt: { gt: now },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),
      this.prisma.company.findMany({
        include: {
          subscriptions: {
            include: {
              plan: true,
            },
          },
          _count: {
            select: {
              companyUsers: true,
              jobOffers: true,
              subscriptions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),
      this.prisma.jobOffer.findMany({
        include: {
          company: true,
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),
      this.prisma.jobApplication.findMany({
        include: {
          user: true,
          jobOffer: {
            include: {
              company: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),
      this.prisma.payment.findMany({
        include: {
          subscription: {
            include: {
              company: true,
              plan: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),
      this.prisma.billingInvoice.findMany({
        include: {
          subscription: {
            include: {
              company: true,
            },
          },
          plan: true,
          payment: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),
      this.prisma.candidateDocument.findMany({
        include: {
          user: true,
          candidateProfile: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      }),
      this.prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
      this.prisma.loginThrottle.findMany({
        where: {
          lockedUntil: {
            gt: now,
          },
        },
        orderBy: {
          lockedUntil: "desc",
        },
        take: 20,
      }),
      this.prisma.userSession.findMany({
        where: {
          reuseDetectedAt: {
            not: null,
          },
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          reuseDetectedAt: "desc",
        },
        take: 20,
      }),
    ]);

    return {
      summary: {
        usersRegistered,
        companiesRegistered,
        jobsPublished,
        applicationsCount,
        paymentsReceived: paidPaymentsCount,
        activePlansCount,
        uploadedDocumentsCount,
        securityAlertsCount: lockedAttemptsCount + reusedSessionsCount + recentFailedLoginsCount,
      },
      users: users.map((user) => ({
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        roleCode: user.primaryRole?.code ?? null,
        isActive: user.isActive,
        companyName: user.companyUsers[0]?.company.name ?? null,
        sessions: user.sessions.length,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
      })),
      companies: companies.map((company) => {
        const activeSubscription = this.findActiveSubscription(company.subscriptions);
        const freePostsRemaining = Math.max(
          0,
          company.freeJobPostsIncluded - company.freeJobPostsUsed,
        );

        return {
          id: company.id,
          name: company.name,
          commercialName: company.commercialName,
          taxId: company.taxId,
          address: company.address,
          contactPosition: company.contactPosition,
          billingEmail: company.billingEmail,
          industry: company.industry,
          status: company.status,
          operationalStatus: this.getOperationalCompanyStatus({
            moderationStatus: company.status,
            hasActiveSubscription: Boolean(activeSubscription),
            freePostsRemaining,
          }),
          city: company.city,
          country: company.country,
          users: company._count.companyUsers,
          jobs: company._count.jobOffers,
          subscriptions: company._count.subscriptions,
          freePostsRemaining,
          activePlanName: activeSubscription?.plan.name ?? this.getFallbackPlanName(),
          hasActiveSubscription: Boolean(activeSubscription),
          createdAt: company.createdAt,
        };
      }),
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        companyName: job.company.name,
        applications: job._count.applications,
        city: job.city,
        country: job.country,
        publishedAt: job.publishedAt,
        createdAt: job.createdAt,
      })),
      applications: applications.map((application) => ({
        id: application.id,
        status: application.status,
        candidateName: `${application.user.firstName} ${application.user.lastName}`.trim(),
        candidateEmail: application.user.email,
        jobTitle: application.jobOffer.title,
        companyName: application.jobOffer.company.name,
        compatibilityScore: application.compatibilityScore,
        appliedAt: application.appliedAt,
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        provider: payment.provider,
        status: payment.status,
        amount: payment.amount.toString(),
        currency: payment.currency,
        companyName: payment.subscription.company.name,
        planName: payment.subscription.plan.name,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        total: invoice.total.toString(),
        currency: invoice.currency,
        companyName: invoice.subscription.company.name,
        planName: invoice.plan.name,
        paidAt: invoice.paidAt,
        issuedAt: invoice.issuedAt,
      })),
      documents: documents.map((document) => ({
        id: document.id,
        fileName: document.fileName,
        type: document.type,
        mimeType: document.mimeType,
        size: document.size,
        candidateName: `${document.user.firstName} ${document.user.lastName}`.trim(),
        candidateEmail: document.user.email,
        createdAt: document.createdAt,
      })),
      auditPreview: auditPreview.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        user: log.user
          ? {
              email: log.user.email,
              name: `${log.user.firstName} ${log.user.lastName}`.trim(),
            }
          : null,
        createdAt: log.createdAt,
      })),
      security: {
        lockedAttempts: lockedAttempts.map((attempt) => ({
          id: attempt.id,
          email: attempt.email,
          ip: attempt.ip,
          failedCount: attempt.failedCount,
          lockedUntil: attempt.lockedUntil,
          lastAttemptAt: attempt.lastAttemptAt,
        })),
        reusedSessions: reusedSessions.map((session) => ({
          id: session.id,
          email: session.user.email,
          name: `${session.user.firstName} ${session.user.lastName}`.trim(),
          ip: session.ip,
          userAgent: session.userAgent,
          reuseDetectedAt: session.reuseDetectedAt,
        })),
        recentFailedLoginsCount,
      },
      configuration: {
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
        supabaseConfigured: Boolean(
          process.env.SUPABASE_URL &&
            process.env.SUPABASE_SERVICE_ROLE_KEY &&
            process.env.SUPABASE_STORAGE_BUCKET,
        ),
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
        paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        payphoneConfigured: Boolean(process.env.PAYPHONE_TOKEN),
        auditLogsEnabled: (process.env.ENABLE_AUDIT_LOGS ?? "true").toLowerCase() !== "false",
        securityHeadersEnabled:
          (process.env.ENABLE_SECURITY_HEADERS ?? "true").toLowerCase() !== "false",
      },
    };
  }

  private getFallbackPlanName() {
    return "Gratis";
  }

  private getOperationalCompanyStatus(input: {
    moderationStatus: string;
    hasActiveSubscription: boolean;
    freePostsRemaining: number;
  }) {
    if (input.moderationStatus === "REJECTED") {
      return "RECHAZADA";
    }

    if (input.hasActiveSubscription) {
      return "PLAN_ACTIVO";
    }

    if (input.freePostsRemaining > 0) {
      return "ACTIVA";
    }

    return "SIN_CARGAS";
  }

  private findActiveSubscription(
    subscriptions: Array<{
      id: string;
      status: SubscriptionStatus;
      startsAt: Date;
      endsAt: Date | null;
      plan: {
        code: PlanCode;
        name: string;
      };
    }>,
  ) {
    const now = new Date();

    return (
      subscriptions.find((subscription) => {
        const isAllowedStatus =
          subscription.status === SubscriptionStatus.ACTIVE ||
          subscription.status === SubscriptionStatus.TRIALING;
        const isStarted = subscription.startsAt <= now;
        const isNotExpired = !subscription.endsAt || subscription.endsAt >= now;

        return isAllowedStatus && isStarted && isNotExpired;
      }) ?? null
    );
  }
}
