import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(roleCode?: string) {
    return this.prisma.user.findMany({
      where: roleCode
        ? {
            primaryRole: {
              code: roleCode,
            },
          }
        : undefined,
      include: {
        primaryRole: true,
        companyUsers: {
          where: {
            isActive: true,
          },
          include: {
            company: true,
          },
        },
        sessions: {
          where: {
            revokedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        primaryRole: true,
        companyUsers: {
          where: {
            isActive: true,
          },
          include: {
            company: true,
          },
        },
        sessions: {
          where: {
            revokedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  updateById(id: string, data: { firstName?: string; lastName?: string; phone?: string; isActive?: boolean }) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        primaryRole: true,
        companyUsers: {
          where: {
            isActive: true,
          },
          include: {
            company: true,
          },
        },
        sessions: {
          where: {
            revokedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }
}
