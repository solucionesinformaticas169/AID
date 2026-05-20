import { Injectable } from "@nestjs/common";
import { EmailDeliveryStatus, EmailTemplateKind, Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EmailsRepository {
  constructor(private readonly prisma: PrismaService) {}

  countRecentDeliveries(input: {
    recipientEmail: string;
    templateKind: EmailTemplateKind;
    windowStart: Date;
  }) {
    return this.prisma.emailDeliveryLog.count({
      where: {
        recipientEmail: input.recipientEmail,
        templateKind: input.templateKind,
        createdAt: {
          gte: input.windowStart,
        },
        status: {
          in: [
            EmailDeliveryStatus.PENDING,
            EmailDeliveryStatus.SENT,
            EmailDeliveryStatus.RATE_LIMITED,
          ],
        },
      },
    });
  }

  createDeliveryLog(input: {
    userId?: string | null;
    templateKind: EmailTemplateKind;
    recipientEmail: string;
    subject: string;
    status?: EmailDeliveryStatus;
    idempotencyKey?: string | null;
    providerEmailId?: string | null;
    errorMessage?: string | null;
    metadata?: Prisma.InputJsonValue;
    sentAt?: Date | null;
  }) {
    return this.prisma.emailDeliveryLog.create({
      data: {
        userId: input.userId,
        templateKind: input.templateKind,
        recipientEmail: input.recipientEmail,
        subject: input.subject,
        status: input.status,
        idempotencyKey: input.idempotencyKey,
        providerEmailId: input.providerEmailId,
        errorMessage: input.errorMessage,
        metadata: input.metadata,
        sentAt: input.sentAt,
      },
    });
  }

  updateDeliveryLog(
    id: string,
    input: {
      status: EmailDeliveryStatus;
      providerEmailId?: string | null;
      errorMessage?: string | null;
      metadata?: Prisma.InputJsonValue;
      sentAt?: Date | null;
    },
  ) {
    return this.prisma.emailDeliveryLog.update({
      where: { id },
      data: {
        status: input.status,
        providerEmailId: input.providerEmailId,
        errorMessage: input.errorMessage,
        metadata: input.metadata,
        sentAt: input.sentAt,
      },
    });
  }
}
