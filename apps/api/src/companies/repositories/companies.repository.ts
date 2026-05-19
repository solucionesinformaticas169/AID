import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

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
}
