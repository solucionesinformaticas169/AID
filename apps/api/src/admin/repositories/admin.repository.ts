import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [companies, users, jobs, pendingCompanies] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.jobOffer.count(),
      this.prisma.company.count({
        where: {
          status: "PENDING",
        },
      }),
    ]);

    return {
      companies,
      users,
      jobs,
      pendingCompanies,
    };
  }
}
