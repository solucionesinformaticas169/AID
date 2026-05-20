import { Injectable, LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { RequestContextSnapshot } from "../common/http/request-context.types";
import { RequestContextService } from "./request-context.service";

type LogLevel = "debug" | "log" | "warn" | "error";

type LogMetadata = {
  context?: string;
  requestId?: string;
  userId?: string | null;
  userRole?: string | null;
  companyId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  event?: string;
  [key: string]: unknown;
};

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly isProduction: boolean;
  private readonly minimumLevel: LogLevel;
  private readonly weights: Record<LogLevel, number> = {
    debug: 10,
    log: 20,
    warn: 30,
    error: 40,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly requestContextService: RequestContextService,
  ) {
    this.isProduction =
      (this.configService.get<string>("NODE_ENV") ?? "development").toLowerCase() === "production";
    this.minimumLevel = this.resolveMinimumLevel(
      (this.configService.get<string>("LOG_LEVEL") ?? "log").toLowerCase(),
    );
  }

  log(message: unknown, metadata?: LogMetadata | string) {
    this.write("log", message, metadata);
  }

  error(message: unknown, traceOrMetadata?: string | LogMetadata, context?: string) {
    if (typeof traceOrMetadata === "string") {
      this.write("error", message, {
        context,
        stack: traceOrMetadata,
      });
      return;
    }

    this.write("error", message, traceOrMetadata);
  }

  warn(message: unknown, metadata?: LogMetadata | string) {
    this.write("warn", message, metadata);
  }

  debug(message: unknown, metadata?: LogMetadata | string) {
    this.write("debug", message, metadata);
  }

  verbose(message: unknown, metadata?: LogMetadata | string) {
    this.write("debug", message, metadata);
  }

  info(message: unknown, metadata?: LogMetadata) {
    this.write("log", message, metadata);
  }

  private write(level: LogLevel, message: unknown, metadata?: LogMetadata | string) {
    if (this.weights[level] < this.weights[this.minimumLevel]) {
      return;
    }

    const context = this.requestContextService.get();
    const normalizedMetadata =
      typeof metadata === "string" ? { context: metadata } : (metadata ?? {});
    const payload = this.buildPayload(level, message, normalizedMetadata, context);

    if (this.isProduction) {
      this.emitProduction(level, payload);
      return;
    }

    this.emitDevelopment(level, payload);
  }

  private buildPayload(
    level: LogLevel,
    message: unknown,
    metadata: LogMetadata,
    context?: RequestContextSnapshot,
  ) {
    const {
      context: logContext,
      requestId,
      userId,
      userRole,
      companyId,
      ip,
      userAgent,
      ...rest
    } = metadata;

    return {
      level,
      timestamp: new Date().toISOString(),
      message: this.stringifyMessage(message),
      context: logContext,
      requestId: requestId ?? context?.requestId,
      userId: userId ?? context?.userId ?? null,
      userRole: userRole ?? context?.userRole ?? null,
      companyId: companyId ?? context?.companyId ?? null,
      ip: ip ?? context?.ip ?? null,
      userAgent: userAgent ?? context?.userAgent ?? null,
      ...rest,
    };
  }

  private emitProduction(level: LogLevel, payload: Record<string, unknown>) {
    const line = JSON.stringify(payload);

    if (level === "error") {
      console.error(line);
      return;
    }

    if (level === "warn") {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  private emitDevelopment(level: LogLevel, payload: Record<string, unknown>) {
    const contextLabel = payload.context ? `[${String(payload.context)}] ` : "";
    const requestLabel = payload.requestId ? ` (${String(payload.requestId)})` : "";
    const suffix = this.formatDevelopmentMetadata(payload);
    const line = `[${payload.timestamp}] ${level.toUpperCase()} ${contextLabel}${payload.message}${requestLabel}${suffix}`;

    if (level === "error") {
      console.error(line);
      return;
    }

    if (level === "warn") {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  private formatDevelopmentMetadata(payload: Record<string, unknown>) {
    const metadata = Object.fromEntries(
      Object.entries(payload).filter(
        ([key, value]) =>
          ![
            "level",
            "timestamp",
            "message",
            "context",
            "requestId",
          ].includes(key) && value !== undefined,
      ),
    );

    const keys = Object.keys(metadata);
    return keys.length > 0 ? ` ${JSON.stringify(metadata)}` : "";
  }

  private stringifyMessage(message: unknown) {
    if (typeof message === "string") {
      return message;
    }

    if (message instanceof Error) {
      return message.message;
    }

    return JSON.stringify(message);
  }

  private resolveMinimumLevel(level: string): LogLevel {
    switch (level) {
      case "debug":
        return "debug";
      case "warn":
        return "warn";
      case "error":
        return "error";
      default:
        return "log";
    }
  }
}
