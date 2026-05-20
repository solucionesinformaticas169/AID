import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { User } from "@prisma/client";

import { AuditService } from "../../audit/audit.service";
import { AUDIT_ENTITY_TYPES } from "../../audit/audit.constants";
import { AppLoggerService } from "../../observability/app-logger.service";
import { AuthRepository } from "../../auth/repositories/auth.repository";
import type { SecurityRequestMetadata } from "./security-request.types";

@Injectable()
export class SecurityService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly auditService: AuditService,
    private readonly logger: AppLoggerService,
  ) {}

  async assertLoginAllowed(email: string, metadata: SecurityRequestMetadata) {
    const throttle = await this.authRepository.findLoginThrottle(email, metadata.ip);

    if (throttle?.lockedUntil && throttle.lockedUntil > new Date()) {
      this.logger.warn("Login blocked temporarily", {
        context: SecurityService.name,
        event: "AUTH_LOGIN_BLOCKED",
        entityType: AUDIT_ENTITY_TYPES.USER,
        email,
        ip: metadata.ip,
        lockedUntil: throttle.lockedUntil.toISOString(),
      });
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta nuevamente despues de ${throttle.lockedUntil.toISOString()}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerFailedLogin(input: {
    email: string;
    user?: Pick<User, "id"> | null;
    reason: string;
    metadata: SecurityRequestMetadata;
  }) {
    const lockMinutes = this.getLoginLockMinutes();
    const maxAttempts = this.getLoginMaxAttempts();
    const updated = await this.authRepository.incrementLoginThrottle({
      email: input.email,
      ip: input.metadata.ip,
      userId: input.user?.id ?? null,
      userAgent: input.metadata.userAgent,
      lockMinutes,
      maxAttempts,
    });

    const locked = Boolean(updated.lockedUntil && updated.lockedUntil > new Date());

    await this.auditService.record({
      action: "AUTH_LOGIN_FAILED",
      userId: input.user?.id ?? null,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: input.user?.id ?? undefined,
      metadata: {
        email: input.email,
        reason: input.reason,
        failedCount: updated.failedCount,
        lockedUntil: updated.lockedUntil?.toISOString() ?? null,
        ip: input.metadata.ip,
      },
    });

    this.logger.warn("Failed login attempt registered", {
      context: SecurityService.name,
      event: "AUTH_LOGIN_FAILED",
      action: "AUTH_LOGIN_FAILED",
      userId: input.user?.id ?? null,
      email: input.email,
      ip: input.metadata.ip,
      failedCount: updated.failedCount,
      locked,
      reason: input.reason,
    });

    if (locked) {
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta nuevamente despues de ${updated.lockedUntil?.toISOString()}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    throw new UnauthorizedException("Credenciales invalidas.");
  }

  async clearFailedLogins(email: string, ip: string) {
    await this.authRepository.clearLoginThrottle(email, ip);
  }

  getSecurityRequestMetadata(requestLike?: {
    ip?: string | null;
    userAgent?: string | null;
  }): SecurityRequestMetadata {
    return {
      ip: requestLike?.ip ?? "unknown",
      userAgent: requestLike?.userAgent ?? null,
    };
  }

  private getLoginMaxAttempts() {
    return Number(process.env.LOGIN_MAX_ATTEMPTS ?? "5");
  }

  private getLoginLockMinutes() {
    return Number(process.env.LOGIN_LOCK_MINUTES ?? "15");
  }
}
