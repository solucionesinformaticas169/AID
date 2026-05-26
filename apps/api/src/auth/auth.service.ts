import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthTokenType } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { AuditService } from "../audit/audit.service";
import { AUDIT_ENTITY_TYPES } from "../audit/audit.constants";
import { ROLE_CODES } from "../common/constants/role-codes";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { SecurityService } from "../common/security/security.service";
import { EmailsService } from "../emails/emails.service";
import { AppLoggerService } from "../observability/app-logger.service";
import { RequestContextService } from "../observability/request-context.service";
import { AuthRepository } from "./repositories/auth.repository";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailsService: EmailsService,
    private readonly auditService: AuditService,
    private readonly logger: AppLoggerService,
    private readonly requestContextService: RequestContextService,
    private readonly securityService: SecurityService,
  ) {}

  async register(payload: RegisterDto) {
    const existingUser = await this.authRepository.findUserByEmail(payload.email);

    if (existingUser) {
      throw new BadRequestException("El correo ya esta registrado.");
    }

    const role = await this.authRepository.findRoleByCode(payload.roleCode ?? ROLE_CODES.CANDIDATE);

    if (!role) {
      throw new BadRequestException("El rol solicitado no existe.");
    }

    const isCompanyAdminRegistration = role.code === ROLE_CODES.COMPANY_ADMIN;

    if (isCompanyAdminRegistration) {
      this.assertCompanyRegistrationPayload(payload);
    }

    if (payload.taxId) {
      const existingCompanyWithTaxId = await this.authRepository.findCompanyByTaxId(payload.taxId);

      if (existingCompanyWithTaxId) {
        throw new BadRequestException("El RUC ya esta registrado.");
      }
    }

    const passwordHash = await hash(payload.password, 10);
    const user = isCompanyAdminRegistration
      ? await this.registerCompanyAdmin(payload, passwordHash, role.id)
      : await this.authRepository.createUser({
          email: payload.email,
          passwordHash,
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          primaryRoleId: role.id,
        });
    const companyId = this.resolveCompanyId(user.companyUsers);
    const session = await this.createSessionBundle(user.id, user.email, role.code, companyId);
    await this.dispatchVerificationEmail(user.id, user.email, `${user.firstName} ${user.lastName}`);
    await this.auditService.record({
      action: "USER_REGISTERED",
      userId: user.id,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: user.id,
      metadata: {
        email: user.email,
        role: role.code,
      },
    });
    this.logger.info("User registered successfully", {
      context: AuthService.name,
      event: "USER_REGISTERED",
      action: "USER_REGISTERED",
      userId: user.id,
      userRole: role.code,
      companyId,
    });

    return {
      message: isCompanyAdminRegistration
        ? "Cuenta empresarial creada correctamente. Ya puedes iniciar sesion."
        : "Usuario registrado correctamente. Revisa tu correo para verificar la cuenta.",
      user: this.serializeUser(
        user.id,
        user.email,
        role.code,
        `${user.firstName} ${user.lastName}`,
        companyId,
      ),
      ...session.tokens,
    };
  }

  async login(payload: LoginDto) {
    const requestMetadata = this.securityService.getSecurityRequestMetadata({
      ip: this.requestContextService.get()?.ip,
      userAgent: this.requestContextService.get()?.userAgent ?? null,
    });
    await this.securityService.assertLoginAllowed(payload.email, requestMetadata);
    const user = await this.authRepository.findUserByEmail(payload.email);

    if (!user) {
      return this.securityService.registerFailedLogin({
        email: payload.email,
        reason: "USER_NOT_FOUND",
        metadata: requestMetadata,
      });
    }

    const isPasswordValid = await compare(payload.password, user.passwordHash);

    if (!isPasswordValid) {
      return this.securityService.registerFailedLogin({
        email: payload.email,
        user,
        reason: "INVALID_PASSWORD",
        metadata: requestMetadata,
      });
    }

    if (this.requiresVerifiedEmail() && !user.emailVerifiedAt) {
      await this.securityService.registerFailedLogin({
        email: payload.email,
        user,
        reason: "EMAIL_NOT_VERIFIED",
        metadata: requestMetadata,
      });
    }

    const roleCode = user.primaryRole?.code ?? ROLE_CODES.CANDIDATE;
    const companyId = this.resolveCompanyId(user.companyUsers);
    await this.securityService.clearFailedLogins(payload.email, requestMetadata.ip);
    const session = await this.createSessionBundle(user.id, user.email, roleCode, companyId);
    await this.auditService.record({
      action: "AUTH_LOGIN",
      userId: user.id,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: user.id,
      metadata: {
        email: user.email,
        role: roleCode,
      },
    });
    this.logger.info("Login successful", {
      context: AuthService.name,
      event: "AUTH_LOGIN",
      action: "AUTH_LOGIN",
      userId: user.id,
      userRole: roleCode,
      companyId,
    });

    return {
      message: "Sesion iniciada correctamente.",
      user: this.serializeUser(
        user.id,
        user.email,
        roleCode,
        `${user.firstName} ${user.lastName}`,
        companyId,
      ),
      ...session.tokens,
    };
  }

  async verifyEmail(payload: VerifyEmailDto) {
    const tokenHash = this.hashToken(payload.token);
    const token = await this.authRepository.findValidAuthToken(
      AuthTokenType.EMAIL_VERIFICATION,
      tokenHash,
    );

    if (!token) {
      throw new BadRequestException("El token de verificacion no es valido o ya expiro.");
    }

    await Promise.all([
      this.authRepository.markEmailVerified(token.userId),
      this.authRepository.consumeAuthToken(token.id),
      this.authRepository.invalidateAuthTokens(token.userId, AuthTokenType.EMAIL_VERIFICATION),
    ]);

    return {
      message: "Correo verificado correctamente.",
    };
  }

  async resendVerification(payload: ResendVerificationDto) {
    const user = await this.authRepository.findUserByEmail(payload.email);

    if (!user || user.emailVerifiedAt) {
      return {
        message: "Si la cuenta existe, enviaremos un nuevo correo de verificacion.",
      };
    }

    await this.dispatchVerificationEmail(
      user.id,
      user.email,
      `${user.firstName} ${user.lastName}`,
    );

    return {
      message: "Si la cuenta existe, enviaremos un nuevo correo de verificacion.",
    };
  }

  async refresh(payload: RefreshTokenDto) {
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET") ?? "refresh-secret";
    const requestMetadata = this.securityService.getSecurityRequestMetadata({
      ip: this.requestContextService.get()?.ip,
      userAgent: this.requestContextService.get()?.userAgent ?? null,
    });

    try {
      const decoded = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
        companyId?: string;
        sid?: string;
      }>(payload.refreshToken, {
        secret: refreshSecret,
      });
      const sessionId = decoded.sid;

      if (!sessionId) {
        throw new UnauthorizedException("Refresh token sin sesion asociada.");
      }

      const session = await this.authRepository.findSessionById(sessionId);

      if (!session || session.userId !== decoded.sub) {
        throw new UnauthorizedException("Sesion no valida para renovacion.");
      }

      if (session.revokedAt || session.expiresAt <= new Date()) {
        throw new UnauthorizedException("La sesion ya no esta activa.");
      }

      const refreshTokenMatches = await compare(payload.refreshToken, session.refreshTokenHash);

      if (!refreshTokenMatches) {
        const reusedPreviousToken = session.previousRefreshTokenHash
          ? await compare(payload.refreshToken, session.previousRefreshTokenHash)
          : false;

        if (reusedPreviousToken) {
          await this.authRepository.markSessionReuseDetected(
            session.id,
            "REFRESH_TOKEN_REUSE_DETECTED",
          );
          await this.authRepository.revokeAllUserSessions(
            session.userId,
            "REFRESH_TOKEN_REUSE_DETECTED",
          );
          this.logger.warn("Refresh token reuse detected", {
            context: AuthService.name,
            event: "AUTH_REFRESH_REUSE_DETECTED",
            userId: session.userId,
            sessionId: session.id,
            ip: requestMetadata.ip,
          });
        }

        throw new UnauthorizedException("Refresh token invalido.");
      }

      const user = session.user;
      const roleCode = user.primaryRole?.code ?? decoded.role;
      const companyId = this.resolveCompanyId(user.companyUsers) ?? decoded.companyId;
      const tokens = await this.issueTokens(user.id, user.email, roleCode, companyId, session.id);
      const nextRefreshTokenHash = await hash(tokens.refreshToken, 10);
      await this.authRepository.rotateSessionRefreshToken({
        sessionId: session.id,
        previousRefreshTokenHash: session.refreshTokenHash,
        refreshTokenHash: nextRefreshTokenHash,
        userAgent: requestMetadata.userAgent,
      });
      await this.authRepository.updateRefreshTokenHash(user.id, nextRefreshTokenHash);
      this.logger.info("Refresh token issued successfully", {
        context: AuthService.name,
        event: "AUTH_REFRESH",
        userId: user.id,
        userRole: roleCode,
        companyId,
        sessionId: session.id,
      });

      return {
        message: "Sesion renovada correctamente.",
        user: this.serializeUser(
          user.id,
          user.email,
          roleCode,
          `${user.firstName} ${user.lastName}`,
          companyId,
        ),
        ...tokens,
      };
    } catch (error) {
      this.logger.warn("Refresh token failed", {
        context: AuthService.name,
        event: "AUTH_REFRESH_FAILED",
      });
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("No se pudo renovar la sesion.");
    }
  }

  async requestPasswordReset(payload: RequestPasswordResetDto) {
    const user = await this.authRepository.findUserByEmail(payload.email);

    if (!user) {
      return {
        message:
          "Si el correo existe en nuestra plataforma, recibiras instrucciones para recuperar el acceso.",
      };
    }

    const rawToken = await this.createTokenRecord(user.id, AuthTokenType.PASSWORD_RESET, {
      expiresInMinutes: 30,
    });

    try {
      await this.emailsService.sendPasswordResetEmail({
        userId: user.id,
        recipientEmail: user.email,
        name: `${user.firstName} ${user.lastName}`,
        resetUrl: this.emailsService.buildPasswordResetUrl(rawToken),
      });
    } catch (error) {
      this.logger.warn(`No se pudo enviar el correo de recuperacion a ${user.email}: ${this.toErrorMessage(error)}`, {
        context: AuthService.name,
        event: "EMAIL_PASSWORD_RESET_SEND_FAILED",
        userId: user.id,
      });
    }

    return {
      message:
        "Si el correo existe en nuestra plataforma, recibiras instrucciones para recuperar el acceso.",
    };
  }

  async resetPassword(payload: ResetPasswordDto) {
    const tokenHash = this.hashToken(payload.token);
    const token = await this.authRepository.findValidAuthToken(
      AuthTokenType.PASSWORD_RESET,
      tokenHash,
    );

    if (!token) {
      throw new BadRequestException("El token para restablecer contrasena no es valido o ya expiro.");
    }

    const passwordHash = await hash(payload.newPassword, 10);

    await Promise.all([
      this.authRepository.updatePassword(token.userId, passwordHash),
      this.authRepository.consumeAuthToken(token.id),
      this.authRepository.invalidateAuthTokens(token.userId, AuthTokenType.PASSWORD_RESET),
      this.authRepository.revokeAllUserSessions(token.userId, "PASSWORD_RESET"),
    ]);

    return {
      message: "Contrasena actualizada correctamente.",
    };
  }

  async logout(user: AuthenticatedUser, payload: LogoutDto) {
    if (!user.sessionId) {
      throw new UnauthorizedException("La sesion activa no pudo resolverse.");
    }

    const session = await this.authRepository.findSessionById(user.sessionId);

    if (!session || session.userId !== user.sub) {
      throw new UnauthorizedException("Sesion no valida.");
    }

    const currentMatches = await compare(payload.refreshToken, session.refreshTokenHash);
    const previousMatches = session.previousRefreshTokenHash
      ? await compare(payload.refreshToken, session.previousRefreshTokenHash)
      : false;

    if (!currentMatches && !previousMatches) {
      throw new UnauthorizedException("Refresh token no coincide con la sesion activa.");
    }

    await this.authRepository.revokeSession(user.sessionId, "USER_LOGOUT");
    this.logger.info("User logged out", {
      context: AuthService.name,
      event: "AUTH_LOGOUT",
      userId: user.sub,
      sessionId: user.sessionId,
    });

    return {
      message: "Sesion cerrada correctamente.",
    };
  }

  async listSessions(userId: string, currentSessionId?: string | null) {
    const sessions = await this.authRepository.listUserSessions(userId);

    return sessions.map((session) => ({
      id: session.id,
      ip: session.ip,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      revokeReason: session.revokeReason,
      isCurrent: currentSessionId === session.id,
    }));
  }

  async revokeSession(user: AuthenticatedUser, sessionId: string) {
    const session = await this.authRepository.findSessionById(sessionId);

    if (!session || session.userId !== user.sub) {
      throw new NotFoundException("La sesion solicitada no existe.");
    }

    await this.authRepository.revokeSession(sessionId, "USER_REVOKED_SESSION");
    return {
      message: "Sesion revocada correctamente.",
    };
  }

  async revokeAllSessions(userId: string, currentSessionId?: string | null) {
    await this.authRepository.revokeAllUserSessions(userId, "USER_REVOKED_ALL_SESSIONS");

    if (currentSessionId) {
      await this.authRepository.revokeSession(currentSessionId, "USER_REVOKED_ALL_SESSIONS");
    }

    return {
      message: "Todas las sesiones fueron revocadas correctamente.",
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    companyId?: string | null,
    sessionId?: string,
  ) {
    const accessSecret = this.configService.get<string>("JWT_ACCESS_SECRET") ?? "access-secret";
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET") ?? "refresh-secret";
    const accessTokenExpiresIn = this.configService.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m";
    const refreshTokenExpiresIn = this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d";
    const tokenPayload = {
      sub: userId,
      email,
      role,
      companyId: companyId ?? undefined,
      sid: sessionId ?? undefined,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: accessSecret,
        expiresIn: accessTokenExpiresIn as never,
      }),
      this.jwtService.signAsync(tokenPayload, {
        secret: refreshSecret,
        expiresIn: refreshTokenExpiresIn as never,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createSessionBundle(
    userId: string,
    email: string,
    role: string,
    companyId?: string | null,
  ) {
    const sessionId = randomUUID();
    const tokens = await this.issueTokens(userId, email, role, companyId, sessionId);
    const refreshTokenHash = await hash(tokens.refreshToken, 10);
    const requestContext = this.requestContextService.get();

    await this.authRepository.createSession({
      id: sessionId,
      userId,
      refreshTokenHash,
      ip: requestContext?.ip ?? null,
      userAgent: requestContext?.userAgent ?? null,
      expiresAt: this.resolveSessionAbsoluteExpiry(),
    });
    await this.authRepository.updateRefreshTokenHash(userId, refreshTokenHash);

    return {
      sessionId,
      tokens,
    };
  }

  private serializeUser(
    id: string,
    email: string,
    role: string,
    name: string,
    companyId?: string | null,
  ) {
    return { id, email, role, name, companyId: companyId ?? null };
  }

  private resolveCompanyId(
    companyUsers:
      | Array<{ companyId: string; company?: { status: string } | null }>
      | undefined,
  ) {
    return companyUsers?.[0]?.companyId ?? null;
  }

  private assertCompanyRegistrationPayload(payload: RegisterDto) {
    if (!payload.companyName) {
      throw new BadRequestException("La razon social es obligatoria.");
    }

    if (!payload.taxId) {
      throw new BadRequestException("El RUC es obligatorio.");
    }

    if (!payload.city) {
      throw new BadRequestException("La ciudad es obligatoria.");
    }

    if (!payload.country) {
      throw new BadRequestException("El pais es obligatorio.");
    }

    if (!payload.contactPosition) {
      throw new BadRequestException("El cargo del responsable es obligatorio.");
    }
  }

  private async registerCompanyAdmin(payload: RegisterDto, passwordHash: string, primaryRoleId: string) {
    const companyRole = await this.authRepository.findRoleByCode(ROLE_CODES.COMPANY_ADMIN);

    if (!companyRole) {
      throw new BadRequestException("No existe el rol de administrador de empresa.");
    }

    const baseSlug = this.slugify(payload.commercialName || payload.companyName || payload.email);
    const companySlug = await this.resolveAvailableCompanySlug(baseSlug);

    return this.authRepository.createCompanyWithAdmin({
      user: {
        email: payload.email,
        passwordHash,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        primaryRoleId,
      },
      company: {
        name: payload.companyName ?? payload.commercialName ?? payload.email,
        commercialName: payload.commercialName,
        slug: companySlug,
        taxId: payload.taxId ?? "",
        address: payload.address,
        contactPosition: payload.contactPosition,
        website: payload.website,
        industry: payload.industry,
        city: payload.city,
        country: payload.country,
        billingEmail: payload.billingEmail ?? payload.email,
      },
      companyRoleId: companyRole.id,
    });
  }

  private async resolveAvailableCompanySlug(baseSlug: string) {
    let slug = baseSlug || `empresa-${randomUUID().slice(0, 8)}`;
    let counter = 1;

    while (await this.authRepository.findCompanyBySlug(slug)) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  private resolveSessionAbsoluteExpiry() {
    const ttlDays = Number(this.configService.get<string>("SESSION_ABSOLUTE_TTL_DAYS") ?? "30");
    return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  }

  private async dispatchVerificationEmail(userId: string, email: string, name: string) {
    const rawToken = await this.createTokenRecord(userId, AuthTokenType.EMAIL_VERIFICATION, {
      expiresInHours: 24,
    });

    try {
      await this.emailsService.sendVerificationEmail({
        userId,
        recipientEmail: email,
        name,
        verificationUrl: this.emailsService.buildVerificationUrl(rawToken),
      });
    } catch (error) {
      this.logger.warn(`No se pudo enviar el correo de verificacion a ${email}: ${this.toErrorMessage(error)}`, {
        context: AuthService.name,
        event: "EMAIL_VERIFICATION_SEND_FAILED",
        userId,
      });
    }
  }

  private async createTokenRecord(
    userId: string,
    type: AuthTokenType,
    options: { expiresInHours?: number; expiresInMinutes?: number },
  ) {
    await this.authRepository.invalidateAuthTokens(userId, type);

    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() +
        (options.expiresInHours ?? 0) * 60 * 60 * 1000 +
        (options.expiresInMinutes ?? 0) * 60 * 1000,
    );

    await this.authRepository.createAuthToken({
      userId,
      type,
      tokenHash: this.hashToken(rawToken),
      expiresAt,
    });

    return rawToken;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private requiresVerifiedEmail() {
    return (this.configService.get<string>("AUTH_REQUIRE_EMAIL_VERIFICATION") ?? "false").toLowerCase() === "true";
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Error desconocido";
  }
}
