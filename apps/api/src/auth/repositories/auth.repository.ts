import { Injectable } from "@nestjs/common";
import { AuthTokenType, Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        primaryRole: true,
        companyUsers: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            companyId: true,
            company: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        primaryRole: true,
        companyUsers: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            companyId: true,
            company: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    primaryRoleId: string;
  }) {
    return this.prisma.user.create({
      data,
      include: {
        primaryRole: true,
        companyUsers: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            companyId: true,
            company: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });
  }

  updateRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
      },
    });
  }

  findRoleByCode(code: string) {
    return this.prisma.role.findUnique({
      where: { code },
    });
  }

  findCompanyByTaxId(taxId: string) {
    return this.prisma.company.findUnique({
      where: { taxId },
      select: { id: true },
    });
  }

  findCompanyBySlug(slug: string) {
    return this.prisma.company.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  createCompanyWithAdmin(input: {
    user: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      phone?: string;
      primaryRoleId: string;
    };
    company: {
      name: string;
      slug: string;
      taxId: string;
      description?: string;
      website?: string;
      industry?: string;
      city?: string;
      country?: string;
      billingEmail?: string;
    };
    companyRoleId: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: input.user.email,
        passwordHash: input.user.passwordHash,
        firstName: input.user.firstName,
        lastName: input.user.lastName,
        phone: input.user.phone,
        primaryRoleId: input.user.primaryRoleId,
        companyUsers: {
          create: {
            role: {
              connect: {
                id: input.companyRoleId,
              },
            },
            company: {
              create: {
                name: input.company.name,
                slug: input.company.slug,
                taxId: input.company.taxId,
                description: input.company.description,
                website: input.company.website,
                industry: input.company.industry,
                city: input.company.city,
                country: input.company.country,
                billingEmail: input.company.billingEmail,
                status: "PENDING",
              },
            },
          },
        },
      },
      include: {
        primaryRole: true,
        companyUsers: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            companyId: true,
            company: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });
  }

  markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
      },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        refreshTokenHash: null,
      },
    });
  }

  createAuthToken(data: {
    userId: string;
    type: AuthTokenType;
    tokenHash: string;
    expiresAt: Date;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.authToken.create({
      data,
    });
  }

  findValidAuthToken(type: AuthTokenType, tokenHash: string) {
    return this.prisma.authToken.findFirst({
      where: {
        type,
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
      include: {
        primaryRole: true,
        companyUsers: {
              where: {
                isActive: true,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                companyId: true,
                company: {
                  select: {
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  createSession(data: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    ip?: string | null;
    userAgent?: string | null;
    expiresAt: Date;
  }) {
    return this.prisma.userSession.create({
      data,
    });
  }

  findSessionById(sessionId: string) {
    return this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            primaryRole: true,
            companyUsers: {
              where: {
                isActive: true,
              },
              orderBy: {
                createdAt: "asc",
              },
              select: {
                companyId: true,
                company: {
                  select: {
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  rotateSessionRefreshToken(input: {
    sessionId: string;
    previousRefreshTokenHash: string;
    refreshTokenHash: string;
    userAgent?: string | null;
  }) {
    return this.prisma.userSession.update({
      where: { id: input.sessionId },
      data: {
        previousRefreshTokenHash: input.previousRefreshTokenHash,
        refreshTokenHash: input.refreshTokenHash,
        lastUsedAt: new Date(),
        userAgent: input.userAgent ?? undefined,
      },
    });
  }

  revokeSession(sessionId: string, revokeReason: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokeReason,
      },
    });
  }

  revokeAllUserSessions(userId: string, revokeReason: string) {
    return this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason,
      },
    });
  }

  markSessionReuseDetected(sessionId: string, revokeReason: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokeReason,
        reuseDetectedAt: new Date(),
      },
    });
  }

  listUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findLoginThrottle(email: string, ip: string) {
    return this.prisma.loginThrottle.findUnique({
      where: {
        email_ip: {
          email,
          ip,
        },
      },
    });
  }

  async incrementLoginThrottle(input: {
    email: string;
    ip: string;
    userId?: string | null;
    userAgent?: string | null;
    maxAttempts: number;
    lockMinutes: number;
  }) {
    const existing = await this.prisma.loginThrottle.findUnique({
      where: {
        email_ip: {
          email: input.email,
          ip: input.ip,
        },
      },
    });

    const failedCount = (existing?.failedCount ?? 0) + 1;
    const lockedUntil =
      failedCount >= input.maxAttempts
        ? new Date(Date.now() + input.lockMinutes * 60 * 1000)
        : null;

    return this.prisma.loginThrottle.upsert({
      where: {
        email_ip: {
          email: input.email,
          ip: input.ip,
        },
      },
      create: {
        email: input.email,
        ip: input.ip,
        userId: input.userId ?? undefined,
        userAgent: input.userAgent ?? undefined,
        failedCount,
        lockedUntil,
        lastAttemptAt: new Date(),
      },
      update: {
        userId: input.userId ?? undefined,
        userAgent: input.userAgent ?? undefined,
        failedCount,
        lockedUntil,
        lastAttemptAt: new Date(),
      },
    });
  }

  clearLoginThrottle(email: string, ip: string) {
    return this.prisma.loginThrottle.deleteMany({
      where: {
        email,
        ip,
      },
    });
  }

  consumeAuthToken(id: string) {
    return this.prisma.authToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }

  invalidateAuthTokens(userId: string, type: AuthTokenType) {
    return this.prisma.authToken.updateMany({
      where: {
        userId,
        type,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }
}
