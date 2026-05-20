import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { AppLoggerService } from "../observability/app-logger.service";
import { PrismaService } from "../prisma/prisma.service";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function readRetentionDays(name: string, fallback: number) {
  const value = Number(process.env[name] ?? String(fallback));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

@Injectable()
export class RetentionService implements OnModuleInit, OnModuleDestroy {
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  onModuleInit() {
    if (!this.isEnabled()) {
      this.logger.log("Retention cleanup disabled by configuration", {
        context: RetentionService.name,
        event: "RETENTION_DISABLED",
      });
      return;
    }

    const initialDelayMs = Number(process.env.RETENTION_INITIAL_DELAY_MS ?? "30000");
    const intervalMs = Number(process.env.RETENTION_RUN_INTERVAL_HOURS ?? "24") * 60 * 60 * 1000;

    setTimeout(() => {
      void this.runCleanup();
      this.cleanupTimer = setInterval(() => {
        void this.runCleanup();
      }, intervalMs);
    }, initialDelayMs);
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  private isEnabled() {
    return (process.env.ENABLE_RETENTION_CLEANUP ?? "true").toLowerCase() !== "false";
  }

  private async runCleanup() {
    const auditRetentionDays = readRetentionDays("AUDIT_LOG_RETENTION_DAYS", 15);
    const loginThrottleRetentionDays = readRetentionDays("LOGIN_THROTTLE_RETENTION_DAYS", 7);
    const sessionRetentionDays = readRetentionDays("SESSION_RETENTION_DAYS", 15);
    const webhookRetentionDays = readRetentionDays("PAYMENT_WEBHOOK_RETENTION_DAYS", 30);

    const now = Date.now();
    const auditCutoff = new Date(now - auditRetentionDays * DAY_IN_MS);
    const loginThrottleCutoff = new Date(now - loginThrottleRetentionDays * DAY_IN_MS);
    const sessionCutoff = new Date(now - sessionRetentionDays * DAY_IN_MS);
    const webhookCutoff = new Date(now - webhookRetentionDays * DAY_IN_MS);

    try {
      const [auditLogs, loginThrottles, sessions, webhookEvents] = await this.prisma.$transaction([
        this.prisma.auditLog.deleteMany({
          where: {
            createdAt: {
              lt: auditCutoff,
            },
          },
        }),
        this.prisma.loginThrottle.deleteMany({
          where: {
            updatedAt: {
              lt: loginThrottleCutoff,
            },
          },
        }),
        this.prisma.userSession.deleteMany({
          where: {
            OR: [
              {
                expiresAt: {
                  lt: sessionCutoff,
                },
              },
              {
                revokedAt: {
                  lt: sessionCutoff,
                },
              },
            ],
          },
        }),
        this.prisma.paymentWebhookEvent.deleteMany({
          where: {
            createdAt: {
              lt: webhookCutoff,
            },
          },
        }),
      ]);

      this.logger.log("Retention cleanup completed", {
        context: RetentionService.name,
        event: "RETENTION_CLEANUP_COMPLETED",
        deletedAuditLogs: auditLogs.count,
        deletedLoginThrottles: loginThrottles.count,
        deletedSessions: sessions.count,
        deletedWebhookEvents: webhookEvents.count,
        auditRetentionDays,
        loginThrottleRetentionDays,
        sessionRetentionDays,
        webhookRetentionDays,
      });
    } catch (error) {
      this.logger.error("Retention cleanup failed", {
        context: RetentionService.name,
        event: "RETENTION_CLEANUP_FAILED",
        message: error instanceof Error ? error.message : "Unknown retention cleanup error",
      });
    }
  }
}

