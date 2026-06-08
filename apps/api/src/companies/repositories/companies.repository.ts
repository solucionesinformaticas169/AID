import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { UpdateCompanyProfileDto } from "../dto/update-company-profile.dto";

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        companyUsers: {
          include: {
            user: true,
            role: true,
          },
        },
      },
    });
  }

  findProfileById(id: string, userId: string) {
    return this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        commercialName: true,
        taxId: true,
        city: true,
        country: true,
        address: true,
        website: true,
        industry: true,
        contactPosition: true,
        billingEmail: true,
        status: true,
        companyUsers: {
          where: {
            userId,
            isActive: true,
          },
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          take: 1,
        },
      },
    });
  }

  findAllPending() {
    return this.prisma.company.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  create(data: { name: string; slug: string; taxId?: string }) {
    return this.prisma.company.create({
      data,
    });
  }

  updateStatus(id: string, status: "APPROVED" | "REJECTED") {
    return this.prisma.company.update({
      where: { id },
      data: { status },
    });
  }

  findCompanyByTaxId(taxId: string) {
    return this.prisma.company.findUnique({
      where: { taxId },
      select: { id: true },
    });
  }

  updateProfile(companyId: string, userId: string, payload: UpdateCompanyProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.update({
        where: { id: companyId },
        data: {
          name: payload.name,
          commercialName: payload.commercialName || null,
          taxId: payload.taxId || null,
          city: payload.city || null,
          country: payload.country || null,
          address: payload.address || null,
          website: payload.website || null,
          industry: payload.industry || null,
          contactPosition: payload.contactPosition || null,
          billingEmail: payload.billingEmail || null,
        },
        select: {
          id: true,
          name: true,
          commercialName: true,
          taxId: true,
          city: true,
          country: true,
          address: true,
          website: true,
          industry: true,
          contactPosition: true,
          billingEmail: true,
          status: true,
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone || null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      });

      return {
        ...company,
        user,
      };
    });
  }

  userHasCompanyAccess(userId: string, companyId: string) {
    return this.prisma.companyUser.findFirst({
      where: {
        userId,
        companyId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });
  }
}
