import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

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

  findProfileDetailByUserId(userId: string) {
    return this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        headline: true,
        summary: true,
        city: true,
        country: true,
        birthDate: true,
        personalInfo: true,
        updatedAt: true,
      },
    });
  }

  ensureCandidateProfileForUser(userId: string) {
    return this.prisma.candidateProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  findResumeGraphByUserId(userId: string) {
    return this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },
        educationRecords: {
          orderBy: [
            {
              graduationYear: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        },
        workExperiences: {
          orderBy: [
            {
              startDate: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        },
        languages: {
          orderBy: {
            createdAt: "desc",
          },
        },
        certifications: {
          orderBy: [
            {
              startDate: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        },
        references: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  findEducationRecordsByUserId(userId: string) {
    return this.prisma.education.findMany({
      where: {
        candidateProfile: {
          userId,
        },
      },
      orderBy: [
        {
          graduationYear: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  findEducationRecordForUser(userId: string, educationId: string) {
    return this.prisma.education.findFirst({
      where: {
        id: educationId,
        candidateProfile: {
          userId,
        },
      },
    });
  }

  findExperienceRecordsByUserId(userId: string) {
    return this.prisma.workExperience.findMany({
      where: {
        candidateProfile: {
          userId,
        },
      },
      orderBy: [
        {
          startDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  findExperienceRecordForUser(userId: string, experienceId: string) {
    return this.prisma.workExperience.findFirst({
      where: {
        id: experienceId,
        candidateProfile: {
          userId,
        },
      },
    });
  }

  findLanguageRecordsByUserId(userId: string) {
    return this.prisma.language.findMany({
      where: {
        candidateProfile: {
          userId,
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });
  }

  findLanguageRecordForUser(userId: string, languageId: string) {
    return this.prisma.language.findFirst({
      where: {
        id: languageId,
        candidateProfile: {
          userId,
        },
      },
    });
  }

  findTrainingRecordsByUserId(userId: string) {
    return this.prisma.certification.findMany({
      where: {
        candidateProfile: {
          userId,
        },
      },
      orderBy: [
        {
          startDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  findTrainingRecordForUser(userId: string, trainingId: string) {
    return this.prisma.certification.findFirst({
      where: {
        id: trainingId,
        candidateProfile: {
          userId,
        },
      },
    });
  }

  findReferenceRecordsByUserId(userId: string) {
    return this.prisma.reference.findMany({
      where: {
        candidateProfile: {
          userId,
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });
  }

  findReferenceRecordForUser(userId: string, referenceId: string) {
    return this.prisma.reference.findFirst({
      where: {
        id: referenceId,
        candidateProfile: {
          userId,
        },
      },
    });
  }

  countReferenceRecordsByUserId(userId: string) {
    return this.prisma.reference.count({
      where: {
        candidateProfile: {
          userId,
        },
      },
    });
  }

  createEducationRecord(input: {
    candidateProfileId: string;
    level?: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    studyTimeValue?: string;
    studyTimeUnit?: string;
    graduationYear?: number;
    senescytNumber?: string;
  }) {
    return this.prisma.education.create({
      data: input,
    });
  }

  createExperienceRecord(input: {
    candidateProfileId: string;
    companyName: string;
    position: string;
    department?: string;
    location?: string;
    contractType?: string;
    workday?: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent: boolean;
    description: string;
    achievements?: string;
    exitReason?: string;
  }) {
    return this.prisma.workExperience.create({
      data: input,
    });
  }

  createLanguageRecord(input: {
    candidateProfileId: string;
    name: string;
    proficiency?: string;
    spokenLevel?: string;
    writtenLevel?: string;
  }) {
    return this.prisma.language.create({
      data: input,
    });
  }

  createTrainingRecord(input: {
    candidateProfileId: string;
    issuer?: string;
    eventType?: string;
    name: string;
    studyArea?: string;
    certificationType?: string;
    startDate?: Date;
    endDate?: Date;
    totalDays?: number;
    totalHours?: number;
    issueDate?: Date;
    expirationDate?: Date;
  }) {
    return this.prisma.certification.create({
      data: input,
    });
  }

  createReferenceRecord(input: {
    candidateProfileId: string;
    fullName: string;
    relationship: string;
    phone: string;
    email?: string;
    city: string;
  }) {
    return this.prisma.reference.create({
      data: input,
    });
  }

  updateEducationRecord(
    educationId: string,
    input: {
      level?: string;
      institution: string;
      degree: string;
      fieldOfStudy?: string;
      studyTimeValue?: string;
      studyTimeUnit?: string;
      graduationYear?: number;
      senescytNumber?: string;
    },
  ) {
    return this.prisma.education.update({
      where: { id: educationId },
      data: input,
    });
  }

  updateExperienceRecord(
    experienceId: string,
    input: {
      companyName: string;
      position: string;
      department?: string;
      location?: string;
      contractType?: string;
      workday?: string;
      startDate?: Date;
      endDate?: Date;
      isCurrent: boolean;
      description: string;
      achievements?: string;
      exitReason?: string;
    },
  ) {
    return this.prisma.workExperience.update({
      where: { id: experienceId },
      data: input,
    });
  }

  updateLanguageRecord(
    languageId: string,
    input: {
      name: string;
      proficiency?: string;
      spokenLevel?: string;
      writtenLevel?: string;
    },
  ) {
    return this.prisma.language.update({
      where: { id: languageId },
      data: input,
    });
  }

  updateTrainingRecord(
    trainingId: string,
    input: {
      issuer?: string;
      eventType?: string;
      name: string;
      studyArea?: string;
      certificationType?: string;
      startDate?: Date;
      endDate?: Date;
      totalDays?: number;
      totalHours?: number;
      issueDate?: Date;
      expirationDate?: Date;
    },
  ) {
    return this.prisma.certification.update({
      where: { id: trainingId },
      data: input,
    });
  }

  updateReferenceRecord(
    referenceId: string,
    input: {
      fullName: string;
      relationship: string;
      phone: string;
      email?: string;
      city: string;
    },
  ) {
    return this.prisma.reference.update({
      where: { id: referenceId },
      data: input,
    });
  }

  deleteEducationRecord(educationId: string) {
    return this.prisma.education.delete({
      where: { id: educationId },
    });
  }

  deleteExperienceRecord(experienceId: string) {
    return this.prisma.workExperience.delete({
      where: { id: experienceId },
    });
  }

  deleteLanguageRecord(languageId: string) {
    return this.prisma.language.delete({
      where: { id: languageId },
    });
  }

  deleteTrainingRecord(trainingId: string) {
    return this.prisma.certification.delete({
      where: { id: trainingId },
    });
  }

  deleteReferenceRecord(referenceId: string) {
    return this.prisma.reference.delete({
      where: { id: referenceId },
    });
  }

  updateProfileCompletion(candidateProfileId: string, profileCompletion: number) {
    return this.prisma.candidateProfile.update({
      where: { id: candidateProfileId },
      data: {
        profileCompletion,
      },
    });
  }

  upsertProfile(userId: string, data: {
    headline?: string;
    summary?: string;
    city?: string;
    country?: string;
    birthDate?: Date | null;
    personalInfo?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  }) {
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
