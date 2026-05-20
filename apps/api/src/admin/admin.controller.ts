import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";

import { ROLE_CODES } from "../common/constants/role-codes";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { ListAuditLogsDto } from "../audit/dto/list-audit-logs.dto";
import { ListAdminUsersDto } from "./dto/list-admin-users.dto";
import { UpdateAdminUserStatusDto } from "./dto/update-admin-user-status.dto";
import { UpdateJobModerationDto } from "./dto/update-job-moderation.dto";
import { AdminService } from "./admin.service";

@Roles(ROLE_CODES.SYSTEM_ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("console")
  getConsoleData() {
    return this.adminService.getConsoleData();
  }

  @Get("companies/pending")
  getPendingCompanies() {
    return this.adminService.getPendingCompanies();
  }

  @Patch("companies/:companyId/approve")
  approveCompany(@Param("companyId") companyId: string) {
    return this.adminService.approveCompany(companyId);
  }

  @Get("jobs/moderation")
  getModerationJobs() {
    return this.adminService.getModerationJobs();
  }

  @Patch("jobs/:jobId/moderation")
  moderateJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param("jobId") jobId: string,
    @Body() payload: UpdateJobModerationDto,
  ) {
    return this.adminService.moderateJob(jobId, payload.action, user.sub);
  }

  @Get("users")
  getUsers(@Query() filters: ListAdminUsersDto) {
    return this.adminService.getUsers(filters);
  }

  @Patch("users/:userId/status")
  updateUserStatus(
    @Param("userId") userId: string,
    @Body() payload: UpdateAdminUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(userId, payload.isActive);
  }

  @Get("users/:userId/sessions")
  listUserSessions(@Param("userId") userId: string) {
    return this.adminService.listUserSessions(userId);
  }

  @Patch("users/:userId/sessions/revoke-all")
  revokeAllUserSessions(@Param("userId") userId: string) {
    return this.adminService.revokeAllUserSessions(userId);
  }

  @Patch("users/:userId/sessions/:sessionId/revoke")
  revokeUserSession(
    @Param("userId") userId: string,
    @Param("sessionId") sessionId: string,
  ) {
    return this.adminService.revokeUserSession(userId, sessionId);
  }

  @Get("audit-logs")
  getAuditLogs(@Query() filters: ListAuditLogsDto) {
    return this.adminService.getAuditLogs(filters);
  }
}
