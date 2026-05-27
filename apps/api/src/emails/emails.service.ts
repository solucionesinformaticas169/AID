import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailDeliveryStatus, EmailTemplateKind, Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { Resend } from "resend";

import { EmailsRepository } from "./repositories/emails.repository";
import {
  renderApplicationSubmittedTemplate,
  renderJobPublishedTemplate,
  renderNewApplicationTemplate,
  renderPasswordResetTemplate,
  renderVerificationTemplate,
} from "./templates/email-templates";

type TransactionalEmailInput = {
  userId?: string | null;
  templateKind: EmailTemplateKind;
  recipientEmail: string;
  subject: string;
  html: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly resendApiKey: string | undefined;
  private readonly resendFromEmail: string;
  private readonly resendReplyTo: string | undefined;
  private readonly resend: Resend | null;

  constructor(
    private readonly emailsRepository: EmailsRepository,
    private readonly configService: ConfigService,
  ) {
    this.resendApiKey = this.configService.get<string>("RESEND_API_KEY");
    this.resendFromEmail =
      this.configService.get<string>("RESEND_FROM_EMAIL") ?? "AIDLABORAL <no-reply@aidlaboral.com>";
    this.resendReplyTo = this.configService.get<string>("RESEND_REPLY_TO");
    this.resend = this.resendApiKey ? new Resend(this.resendApiKey) : null;
  }

  async sendVerificationEmail(input: {
    userId: string;
    recipientEmail: string;
    name: string;
    verificationUrl: string;
  }) {
    return this.sendTransactionalEmail({
      userId: input.userId,
      templateKind: EmailTemplateKind.VERIFY_EMAIL,
      recipientEmail: input.recipientEmail,
      subject: "Verifica tu correo en AIDLABORAL",
      html: renderVerificationTemplate({
        name: input.name,
        verificationUrl: input.verificationUrl,
      }),
      idempotencyKey: this.buildUrlScopedIdempotencyKey("verify-email", input.userId, input.verificationUrl),
      metadata: {
        verificationUrl: input.verificationUrl,
      },
    });
  }

  async sendPasswordResetEmail(input: {
    userId: string;
    recipientEmail: string;
    name: string;
    resetUrl: string;
    expiresInMinutes: number;
  }) {
    return this.sendTransactionalEmail({
      userId: input.userId,
      templateKind: EmailTemplateKind.PASSWORD_RESET,
      recipientEmail: input.recipientEmail,
      subject: "Recupera tu contrasena en AIDLABORAL",
      html: renderPasswordResetTemplate({
        name: input.name,
        resetUrl: input.resetUrl,
        expiresInMinutes: input.expiresInMinutes,
      }),
      idempotencyKey: this.buildUrlScopedIdempotencyKey("password-reset", input.userId, input.resetUrl),
      metadata: {
        resetUrl: input.resetUrl,
        expiresInMinutes: input.expiresInMinutes,
      },
    });
  }

  async sendApplicationSubmittedEmail(input: {
    userId: string;
    recipientEmail: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
    dashboardUrl: string;
    applicationId: string;
  }) {
    return this.sendTransactionalEmail({
      userId: input.userId,
      templateKind: EmailTemplateKind.APPLICATION_SUBMITTED,
      recipientEmail: input.recipientEmail,
      subject: `Postulacion registrada: ${input.jobTitle}`,
      html: renderApplicationSubmittedTemplate({
        candidateName: input.candidateName,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        dashboardUrl: input.dashboardUrl,
      }),
      idempotencyKey: `application-submitted/${input.applicationId}/${input.userId}`,
      metadata: {
        applicationId: input.applicationId,
      },
    });
  }

  async sendNewApplicationEmail(input: {
    recipientEmail: string;
    recruiterName: string;
    candidateName: string;
    jobTitle: string;
    dashboardUrl: string;
    applicationId: string;
    userId?: string | null;
  }) {
    return this.sendTransactionalEmail({
      userId: input.userId,
      templateKind: EmailTemplateKind.NEW_APPLICATION,
      recipientEmail: input.recipientEmail,
      subject: `Nuevo postulante para ${input.jobTitle}`,
      html: renderNewApplicationTemplate({
        recruiterName: input.recruiterName,
        candidateName: input.candidateName,
        jobTitle: input.jobTitle,
        dashboardUrl: input.dashboardUrl,
      }),
      idempotencyKey: `new-application/${input.applicationId}/${input.recipientEmail}`,
      metadata: {
        applicationId: input.applicationId,
      },
    });
  }

  async sendJobPublishedEmail(input: {
    recipientEmail: string;
    recipientName: string;
    jobTitle: string;
    companyName: string;
    dashboardUrl: string;
    publicJobUrl?: string;
    jobId: string;
    userId?: string | null;
  }) {
    return this.sendTransactionalEmail({
      userId: input.userId,
      templateKind: EmailTemplateKind.JOB_PUBLISHED,
      recipientEmail: input.recipientEmail,
      subject: `Vacante publicada: ${input.jobTitle}`,
      html: renderJobPublishedTemplate({
        recipientName: input.recipientName,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        dashboardUrl: input.dashboardUrl,
        publicJobUrl: input.publicJobUrl,
      }),
      idempotencyKey: `job-published/${input.jobId}/${input.recipientEmail}`,
      metadata: {
        jobId: input.jobId,
      },
    });
  }

  buildVerificationUrl(token: string) {
    const publicWebUrl = this.getPublicWebUrl();
    return `${publicWebUrl}/verificar-correo?token=${encodeURIComponent(token)}`;
  }

  buildPasswordResetUrl(token: string) {
    const publicWebUrl = this.getPublicWebUrl();
    return `${publicWebUrl}/restablecer-clave?token=${encodeURIComponent(token)}`;
  }

  buildCandidateDashboardUrl() {
    return `${this.getPublicWebUrl()}/candidato`;
  }

  buildCompanyDashboardUrl() {
    return `${this.getPublicWebUrl()}/empresa`;
  }

  buildPublicJobUrl(slug: string) {
    return `${this.getPublicWebUrl()}/vacantes/${slug}`;
  }

  private async sendTransactionalEmail(input: TransactionalEmailInput) {
    await this.assertRateLimit(input.recipientEmail, input.templateKind);

    const deliveryLog = await this.emailsRepository.createDeliveryLog({
      userId: input.userId,
      templateKind: input.templateKind,
      recipientEmail: input.recipientEmail,
      subject: input.subject,
      idempotencyKey: input.idempotencyKey,
      status: EmailDeliveryStatus.PENDING,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    });

    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY no configurado. Se omitio el envio de ${input.templateKind} a ${input.recipientEmail}.`,
      );

      await this.emailsRepository.updateDeliveryLog(deliveryLog.id, {
        status: EmailDeliveryStatus.SKIPPED,
        errorMessage: "RESEND_API_KEY no configurado.",
      });

      return { status: "skipped" as const };
    }

    try {
      const { data, error } = await this.resend.emails.send(
        {
          from: this.resendFromEmail,
          to: [input.recipientEmail],
          replyTo: this.resendReplyTo ? [this.resendReplyTo] : undefined,
          subject: input.subject,
          html: input.html,
        },
        {
          idempotencyKey: input.idempotencyKey,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      await this.emailsRepository.updateDeliveryLog(deliveryLog.id, {
        status: EmailDeliveryStatus.SENT,
        providerEmailId: data?.id,
        sentAt: new Date(),
      });

      this.logger.log(
        `Correo ${input.templateKind} enviado a ${input.recipientEmail} con id ${data?.id ?? "sin-id"}.`,
      );

      return { status: "sent" as const, providerEmailId: data?.id ?? null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido enviando correo.";
      this.logger.error(
        `Fallo enviando correo ${input.templateKind} a ${input.recipientEmail}: ${message}`,
      );

      await this.emailsRepository.updateDeliveryLog(deliveryLog.id, {
        status: EmailDeliveryStatus.FAILED,
        errorMessage: message,
      });

      return { status: "failed" as const, errorMessage: message };
    }
  }

  private async assertRateLimit(recipientEmail: string, templateKind: EmailTemplateKind) {
    const windowMinutes = Number(this.configService.get<string>("EMAIL_RATE_LIMIT_WINDOW_MINUTES") ?? "60");
    const maxPerWindow = Number(this.configService.get<string>("EMAIL_RATE_LIMIT_MAX_PER_WINDOW") ?? "5");
    const windowStart = new Date(Date.now() - windowMinutes * 60_000);
    const deliveries = await this.emailsRepository.countRecentDeliveries({
      recipientEmail,
      templateKind,
      windowStart,
    });

    if (deliveries >= maxPerWindow) {
      await this.emailsRepository.createDeliveryLog({
        templateKind,
        recipientEmail,
        subject: `Rate limit ${templateKind}`,
        status: EmailDeliveryStatus.RATE_LIMITED,
        errorMessage: `Se supero el limite de ${maxPerWindow} envios en ${windowMinutes} minutos.`,
      });

      throw new HttpException(
        "Superaste temporalmente el limite de correos. Intenta nuevamente en unos minutos.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private getPublicWebUrl() {
    return (
      this.configService.get<string>("PUBLIC_WEB_URL") ??
      this.configService.get<string>("FRONTEND_URL") ??
      "http://localhost:3000"
    );
  }

  private buildUrlScopedIdempotencyKey(prefix: string, userId: string, url: string) {
    const fingerprint = createHash("sha256").update(url).digest("hex").slice(0, 16);
    return `${prefix}/${userId}/${fingerprint}`;
  }
}
