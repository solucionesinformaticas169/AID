import { Injectable } from "@nestjs/common";

import { AppLoggerService } from "../observability/app-logger.service";
import { AuditService } from "../audit/audit.service";
import { ListAuditLogsDto } from "../audit/dto/list-audit-logs.dto";
import { AuthRepository } from "../auth/repositories/auth.repository";
import { CompaniesService } from "../companies/companies.service";
import { JobsService } from "../jobs/jobs.service";
import { UsersService } from "../users/users.service";
import { ListEmailDeliveriesDto } from "./dto/list-email-deliveries.dto";
import { ListAdminUsersDto } from "./dto/list-admin-users.dto";
import {
  type JobModerationAction,
} from "./dto/update-job-moderation.dto";
import { AdminRepository } from "./repositories/admin.repository";

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly auditService: AuditService,
    private readonly authRepository: AuthRepository,
    private readonly companiesService: CompaniesService,
    private readonly jobsService: JobsService,
    private readonly logger: AppLoggerService,
    private readonly usersService: UsersService,
  ) {}

  getDashboard() {
    return this.adminRepository.getDashboard();
  }

  getConsoleData() {
    return this.adminRepository.getConsoleData();
  }

  getPendingCompanies() {
    return this.companiesService.findPendingApprovals();
  }

  approveCompany(companyId: string) {
    return this.companiesService.approveCompany(companyId);
  }

  getModerationJobs() {
    return this.jobsService.getModerationQueue();
  }

  moderateJob(jobId: string, action: JobModerationAction, reviewerUserId: string) {
    return this.jobsService.moderateJob(jobId, action, reviewerUserId);
  }

  async getUsers(filters?: ListAdminUsersDto) {
    const users = await this.usersService.getAll(filters?.roleCode);

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone,
      isActive: user.isActive,
      roleCode: user.primaryRole?.code ?? null,
      roleName: user.primaryRole?.name ?? null,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      company: user.companyUsers[0]
        ? {
            id: user.companyUsers[0].company.id,
            name: user.companyUsers[0].company.name,
          }
        : null,
      activeSessions: user.sessions.map((session) => ({
        id: session.id,
        ip: session.ip,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
      })),
      activeSessionCount: user.sessions.length,
    }));
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await this.usersService.setActiveStatus(userId, isActive);

    if (!isActive) {
      await this.authRepository.revokeAllUserSessions(userId, "ADMIN_DEACTIVATED_USER");
    }

    this.logger.info("Admin updated user status", {
      context: AdminService.name,
      event: "ADMIN_USER_STATUS_UPDATED",
      userId,
      isActive,
    });

    return {
      message: isActive ? "Usuario reactivado correctamente." : "Usuario suspendido correctamente.",
      user,
    };
  }

  async listUserSessions(userId: string) {
    await this.usersService.getById(userId);
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
    }));
  }

  async revokeUserSession(userId: string, sessionId: string) {
    const session = await this.authRepository.findSessionById(sessionId);

    if (!session || session.userId !== userId) {
      return {
        message: "La sesion solicitada no existe para este usuario.",
      };
    }

    await this.authRepository.revokeSession(sessionId, "ADMIN_REVOKED_SESSION");
    this.logger.info("Admin revoked user session", {
      context: AdminService.name,
      event: "ADMIN_USER_SESSION_REVOKED",
      userId,
      sessionId,
    });

    return {
      message: "Sesion revocada correctamente.",
    };
  }

  async revokeAllUserSessions(userId: string) {
    await this.usersService.getById(userId);
    await this.authRepository.revokeAllUserSessions(userId, "ADMIN_REVOKED_ALL_SESSIONS");
    this.logger.info("Admin revoked all user sessions", {
      context: AdminService.name,
      event: "ADMIN_ALL_USER_SESSIONS_REVOKED",
      userId,
    });

    return {
      message: "Todas las sesiones activas del usuario fueron revocadas.",
    };
  }

  getAuditLogs(filters: ListAuditLogsDto) {
    return this.auditService.listAuditLogs(filters);
  }

  getEmailDeliveries(filters: ListEmailDeliveriesDto) {
    return this.adminRepository.listEmailDeliveries(filters);
  }

  async deleteUsersByEmails(emails: string[]) {
    const normalizedEmails = Array.from(
      new Set(
        emails
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email.length > 0),
      ),
    );

    const result = await this.adminRepository.deleteUsersByEmails(normalizedEmails);

    this.logger.warn("Admin deleted users permanently", {
      context: AdminService.name,
      event: "ADMIN_USERS_DELETED",
      emails: normalizedEmails,
      deletedUsers: result.deletedUsers,
      deletedCompanies: result.deletedCompanies,
    });

    return {
      message: "Usuarios eliminados correctamente.",
      ...result,
    };
  }
}
