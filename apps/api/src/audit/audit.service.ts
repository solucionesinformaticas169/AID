import { Injectable } from "@nestjs/common";
import { AuditAction, Prisma } from "@prisma/client";

import { RequestContextService } from "../observability/request-context.service";
import { AuditRepository } from "./audit.repository";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly requestContextService: RequestContextService,
  ) {}

  async record(input: {
    action: AuditAction | `${AuditAction}`;
    userId?: string | null;
    entityType?: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    if (!this.isEnabled()) {
      return null;
    }

    const context = this.requestContextService.get();
    return this.auditRepository.createAuditLog({
      userId: input.userId ?? context?.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
      ip: context?.ip ?? null,
      userAgent: context?.userAgent ?? null,
      requestId: context?.requestId ?? null,
    });
  }

  listAuditLogs(filters: ListAuditLogsDto) {
    return this.auditRepository.findAuditLogs(filters);
  }

  private isEnabled() {
    return (process.env.ENABLE_AUDIT_LOGS ?? "true").toLowerCase() !== "false";
  }
}
