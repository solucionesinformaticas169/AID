import { Injectable } from "@nestjs/common";
import { AuditAction, Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  createAuditLog(data: {
    userId?: string | null;
    action: AuditAction | `${AuditAction}`;
    entityType?: string;
    entityId?: string;
    ip?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        action: data.action as AuditAction,
        userId: data.userId ?? undefined,
        ip: data.ip ?? undefined,
        userAgent: data.userAgent ?? undefined,
        requestId: data.requestId ?? undefined,
      },
      include: {
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

  findAuditLogs(filters: ListAuditLogsDto) {
    const where: Prisma.AuditLogWhereInput = {
      userId: filters.userId ?? undefined,
      action: filters.action ? (filters.action as AuditAction) : undefined,
      entityType: filters.entityType ?? undefined,
      entityId: filters.entityId ?? undefined,
      createdAt:
        filters.dateFrom || filters.dateTo
          ? {
              gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
              lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
            }
          : undefined,
    };

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });
  }
}
