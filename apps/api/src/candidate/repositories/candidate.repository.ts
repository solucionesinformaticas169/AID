import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CandidateRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProfileByUserId(userId: string) {
    return this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        documents: true,
        applications: {
          include: {
            jobOffer: true,
          },
        },
      },
    });
  }

  upsertProfile(userId: string, data: { headline?: string; summary?: string; city?: string; country?: string }) {
    return this.prisma.candidateProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
      include: {
        documents: true,
        applications: {
          include: {
            jobOffer: true,
          },
        },
      },
    });
  }
}
