import { Injectable, NotFoundException } from "@nestjs/common";
import { DocumentType } from "@prisma/client";

import { UpdateCandidateProfileDto } from "./dto/update-candidate-profile.dto";
import { UpsertCandidateEducationDto } from "./dto/upsert-candidate-education.dto";
import { UpsertCandidateExperienceDto } from "./dto/upsert-candidate-experience.dto";
import { UpsertCandidateLanguageDto } from "./dto/upsert-candidate-language.dto";
import { UpsertCandidateReferenceDto } from "./dto/upsert-candidate-reference.dto";
import { UpsertCandidateTrainingDto } from "./dto/upsert-candidate-training.dto";
import { CandidateRepository } from "./repositories/candidate.repository";

@Injectable()
export class CandidateService {
  constructor(private readonly candidateRepository: CandidateRepository) {}

  private mapEducationRecord(record: {
    id: string;
    level: string | null;
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
    studyTimeValue: string | null;
    studyTimeUnit: string | null;
    graduationYear: number | null;
    senescytNumber: string | null;
  }) {
    return {
      id: record.id,
      level: record.level ?? "Sin definir",
      institution: record.institution,
      title: record.degree,
      studyArea: record.fieldOfStudy ?? "",
      studyTimeValue: record.studyTimeValue ?? "",
      studyTimeUnit: record.studyTimeUnit ?? "",
      graduationYear: record.graduationYear ? String(record.graduationYear) : "",
      senescyt: record.senescytNumber ?? "",
    };
  }

  private mapExperienceRecord(record: {
    id: string;
    companyName: string;
    position: string;
    department: string | null;
    startDate: Date | null;
    endDate: Date | null;
    isCurrent: boolean;
    location: string | null;
    contractType: string | null;
    workday: string | null;
    description: string | null;
    achievements: string | null;
    exitReason: string | null;
  }) {
    return {
      id: record.id,
      company: record.companyName,
      position: record.position,
      department: record.department ?? "",
      startDate: record.startDate?.toISOString().slice(0, 10) ?? "",
      endDate: record.endDate?.toISOString().slice(0, 10) ?? "",
      currentlyWorking: record.isCurrent ? "SI" : "NO",
      city: record.location ?? "",
      contractType: record.contractType ?? "Seleccione",
      workday: record.workday ?? "Seleccione",
      responsibilities: record.description ?? "",
      achievements: record.achievements ?? "",
      exitReason: record.exitReason ?? "",
    };
  }

  private mapLanguageRecord(record: {
    id: string;
    name: string;
    proficiency: string | null;
    spokenLevel: string | null;
    writtenLevel: string | null;
  }) {
    return {
      id: record.id,
      language: record.name,
      spokenLevel: record.spokenLevel ?? record.proficiency ?? "",
      writtenLevel: record.writtenLevel ?? record.proficiency ?? "",
    };
  }

  private mapTrainingRecord(record: {
    id: string;
    issuer: string | null;
    eventType: string | null;
    name: string;
    studyArea: string | null;
    certificationType: string | null;
    startDate: Date | null;
    endDate: Date | null;
    totalDays: number | null;
    totalHours: number | null;
  }) {
    return {
      id: record.id,
      institution: record.issuer ?? "",
      eventType: record.eventType ?? "",
      eventName: record.name,
      studyArea: record.studyArea ?? "",
      certificationType: record.certificationType ?? "",
      startDate: record.startDate?.toISOString().slice(0, 10) ?? "",
      endDate: record.endDate?.toISOString().slice(0, 10) ?? "",
      totalDays: record.totalDays ? String(record.totalDays) : "",
      totalHours: record.totalHours ? String(record.totalHours) : "",
    };
  }

  private mapReferenceRecord(record: {
    id: string;
    fullName: string;
    relationship: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
  }) {
    return {
      id: record.id,
      fullName: record.fullName,
      relationship: record.relationship ?? "",
      phone: record.phone ?? "",
      email: record.email ?? "",
      city: record.city ?? "",
    };
  }

  private calculateCompletion(personalInfo: Record<string, unknown> | null | undefined, input: {
    educationCount: number;
    languageCount: number;
    trainingCount: number;
    experienceCount: number;
    referenceCount: number;
    hasCv: boolean;
  }) {
    const safePersonalInfo = (personalInfo ?? {}) as Record<string, unknown>;
    const requiredValues = [
      safePersonalInfo.documentNumber,
      safePersonalInfo.paternalLastName,
      safePersonalInfo.firstName,
      safePersonalInfo.birthDate,
      safePersonalInfo.birthCountry,
      safePersonalInfo.gender,
      safePersonalInfo.maritalStatus,
      safePersonalInfo.addressCountry,
      safePersonalInfo.province,
      safePersonalInfo.canton,
      safePersonalInfo.mainStreet,
      safePersonalInfo.mobilePhone,
      safePersonalInfo.email1,
    ];
    const completedPersonal = requiredValues.filter((value) => String(value ?? "").trim().length > 0).length;
    let score = Math.round((completedPersonal / requiredValues.length) * 40);
    if (input.educationCount > 0) score += 10;
    if (input.languageCount > 0) score += 10;
    if (input.trainingCount > 0) score += 10;
    if (input.experienceCount > 0) score += 10;
    if (input.referenceCount > 0) score += 10;
    if (input.hasCv) score += 10;
    return Math.min(score, 100);
  }

  private async syncProfileCompletion(userId: string) {
    const snapshot = await this.candidateRepository.findResumeGraphByUserId(userId);

    if (!snapshot) {
      return 0;
    }

    const completion = this.calculateCompletion(snapshot.personalInfo as Record<string, unknown> | null | undefined, {
      educationCount: snapshot.educationRecords.length,
      languageCount: snapshot.languages.length,
      trainingCount: snapshot.certifications.length,
      experienceCount: snapshot.workExperiences.length,
      referenceCount: snapshot.references.length,
      hasCv: snapshot.documents.some((document) => document.type === DocumentType.CV),
    });

    if (snapshot.profileCompletion !== completion) {
      await this.candidateRepository.updateProfileCompletion(snapshot.id, completion);
    }

    return completion;
  }

  async refreshProfileCompletion(userId: string) {
    return this.syncProfileCompletion(userId);
  }

  async getExperienceRecords(userId: string) {
    const records = await this.candidateRepository.findExperienceRecordsByUserId(userId);

    return records.map((record) => this.mapExperienceRecord(record));
  }

  async getLanguageRecords(userId: string) {
    const records = await this.candidateRepository.findLanguageRecordsByUserId(userId);

    return records.map((record) => this.mapLanguageRecord(record));
  }

  async getTrainingRecords(userId: string) {
    const records = await this.candidateRepository.findTrainingRecordsByUserId(userId);

    return records.map((record) => this.mapTrainingRecord(record));
  }

  async getReferenceRecords(userId: string) {
    const records = await this.candidateRepository.findReferenceRecordsByUserId(userId);

    return records.map((record) => this.mapReferenceRecord(record));
  }

  async getEducationRecords(userId: string) {
    const records = await this.candidateRepository.findEducationRecordsByUserId(userId);

    return records.map((record) => this.mapEducationRecord(record));
  }

  async createEducationRecord(userId: string, payload: UpsertCandidateEducationDto) {
    const profile = await this.candidateRepository.ensureCandidateProfileForUser(userId);

    const record = await this.candidateRepository.createEducationRecord({
      candidateProfileId: profile.id,
      level: payload.level?.trim(),
      institution: payload.institution.trim(),
      degree: payload.degree.trim(),
      fieldOfStudy: payload.fieldOfStudy?.trim(),
      studyTimeValue: payload.studyTimeValue?.trim(),
      studyTimeUnit: payload.studyTimeUnit?.trim(),
      graduationYear: payload.graduationYear,
      senescytNumber: payload.senescytNumber?.trim(),
    });

    await this.syncProfileCompletion(userId);

    return this.mapEducationRecord(record);
  }

  async updateEducationRecord(userId: string, educationId: string, payload: UpsertCandidateEducationDto) {
    const existing = await this.candidateRepository.findEducationRecordForUser(userId, educationId);

    if (!existing) {
      throw new NotFoundException("No se encontro la instruccion formal seleccionada.");
    }

    const record = await this.candidateRepository.updateEducationRecord(educationId, {
      level: payload.level?.trim(),
      institution: payload.institution.trim(),
      degree: payload.degree.trim(),
      fieldOfStudy: payload.fieldOfStudy?.trim(),
      studyTimeValue: payload.studyTimeValue?.trim(),
      studyTimeUnit: payload.studyTimeUnit?.trim(),
      graduationYear: payload.graduationYear,
      senescytNumber: payload.senescytNumber?.trim(),
    });

    await this.syncProfileCompletion(userId);

    return this.mapEducationRecord(record);
  }

  async deleteEducationRecord(userId: string, educationId: string) {
    const existing = await this.candidateRepository.findEducationRecordForUser(userId, educationId);

    if (!existing) {
      throw new NotFoundException("No se encontro la instruccion formal seleccionada.");
    }

    await this.candidateRepository.deleteEducationRecord(educationId);
    await this.syncProfileCompletion(userId);

    return {
      message: "Instruccion formal eliminada correctamente.",
    };
  }

  async createExperienceRecord(userId: string, payload: UpsertCandidateExperienceDto) {
    const profile = await this.candidateRepository.ensureCandidateProfileForUser(userId);

    const record = await this.candidateRepository.createExperienceRecord({
      candidateProfileId: profile.id,
      companyName: payload.company.trim(),
      position: payload.position.trim(),
      department: payload.department?.trim(),
      location: payload.city.trim(),
      contractType: payload.contractType?.trim(),
      workday: payload.workday?.trim(),
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      isCurrent: payload.currentlyWorking === "SI",
      description: payload.responsibilities.trim(),
      achievements: payload.achievements?.trim(),
      exitReason: payload.exitReason?.trim(),
    });

    await this.syncProfileCompletion(userId);

    return this.mapExperienceRecord(record);
  }

  async updateExperienceRecord(userId: string, experienceId: string, payload: UpsertCandidateExperienceDto) {
    const existing = await this.candidateRepository.findExperienceRecordForUser(userId, experienceId);

    if (!existing) {
      throw new NotFoundException("No se encontro la experiencia seleccionada.");
    }

    const record = await this.candidateRepository.updateExperienceRecord(experienceId, {
      companyName: payload.company.trim(),
      position: payload.position.trim(),
      department: payload.department?.trim(),
      location: payload.city.trim(),
      contractType: payload.contractType?.trim(),
      workday: payload.workday?.trim(),
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      isCurrent: payload.currentlyWorking === "SI",
      description: payload.responsibilities.trim(),
      achievements: payload.achievements?.trim(),
      exitReason: payload.exitReason?.trim(),
    });

    await this.syncProfileCompletion(userId);

    return this.mapExperienceRecord(record);
  }

  async deleteExperienceRecord(userId: string, experienceId: string) {
    const existing = await this.candidateRepository.findExperienceRecordForUser(userId, experienceId);

    if (!existing) {
      throw new NotFoundException("No se encontro la experiencia seleccionada.");
    }

    await this.candidateRepository.deleteExperienceRecord(experienceId);
    await this.syncProfileCompletion(userId);

    return {
      message: "Experiencia eliminada correctamente.",
    };
  }

  async createLanguageRecord(userId: string, payload: UpsertCandidateLanguageDto) {
    const profile = await this.candidateRepository.ensureCandidateProfileForUser(userId);

    const record = await this.candidateRepository.createLanguageRecord({
      candidateProfileId: profile.id,
      name: payload.language.trim(),
      proficiency: payload.spokenLevel.trim(),
      spokenLevel: payload.spokenLevel.trim(),
      writtenLevel: payload.writtenLevel.trim(),
    });

    await this.syncProfileCompletion(userId);

    return this.mapLanguageRecord(record);
  }

  async updateLanguageRecord(userId: string, languageId: string, payload: UpsertCandidateLanguageDto) {
    const existing = await this.candidateRepository.findLanguageRecordForUser(userId, languageId);

    if (!existing) {
      throw new NotFoundException("No se encontro el idioma seleccionado.");
    }

    const record = await this.candidateRepository.updateLanguageRecord(languageId, {
      name: payload.language.trim(),
      proficiency: payload.spokenLevel.trim(),
      spokenLevel: payload.spokenLevel.trim(),
      writtenLevel: payload.writtenLevel.trim(),
    });

    await this.syncProfileCompletion(userId);

    return this.mapLanguageRecord(record);
  }

  async deleteLanguageRecord(userId: string, languageId: string) {
    const existing = await this.candidateRepository.findLanguageRecordForUser(userId, languageId);

    if (!existing) {
      throw new NotFoundException("No se encontro el idioma seleccionado.");
    }

    await this.candidateRepository.deleteLanguageRecord(languageId);
    await this.syncProfileCompletion(userId);

    return {
      message: "Idioma eliminado correctamente.",
    };
  }

  async createTrainingRecord(userId: string, payload: UpsertCandidateTrainingDto) {
    const profile = await this.candidateRepository.ensureCandidateProfileForUser(userId);

    const record = await this.candidateRepository.createTrainingRecord({
      candidateProfileId: profile.id,
      issuer: payload.institution.trim(),
      eventType: payload.eventType.trim(),
      name: payload.eventName.trim(),
      studyArea: payload.studyArea.trim(),
      certificationType: payload.certificationType.trim(),
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      totalDays: payload.totalDays ? Number(payload.totalDays) : undefined,
      totalHours: payload.totalHours ? Number(payload.totalHours) : undefined,
      issueDate: payload.startDate ? new Date(payload.startDate) : undefined,
      expirationDate: payload.endDate ? new Date(payload.endDate) : undefined,
    });

    await this.syncProfileCompletion(userId);

    return this.mapTrainingRecord(record);
  }

  async updateTrainingRecord(userId: string, trainingId: string, payload: UpsertCandidateTrainingDto) {
    const existing = await this.candidateRepository.findTrainingRecordForUser(userId, trainingId);

    if (!existing) {
      throw new NotFoundException("No se encontro la capacitacion seleccionada.");
    }

    const record = await this.candidateRepository.updateTrainingRecord(trainingId, {
      issuer: payload.institution.trim(),
      eventType: payload.eventType.trim(),
      name: payload.eventName.trim(),
      studyArea: payload.studyArea.trim(),
      certificationType: payload.certificationType.trim(),
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      totalDays: payload.totalDays ? Number(payload.totalDays) : undefined,
      totalHours: payload.totalHours ? Number(payload.totalHours) : undefined,
      issueDate: payload.startDate ? new Date(payload.startDate) : undefined,
      expirationDate: payload.endDate ? new Date(payload.endDate) : undefined,
    });

    await this.syncProfileCompletion(userId);

    return this.mapTrainingRecord(record);
  }

  async deleteTrainingRecord(userId: string, trainingId: string) {
    const existing = await this.candidateRepository.findTrainingRecordForUser(userId, trainingId);

    if (!existing) {
      throw new NotFoundException("No se encontro la capacitacion seleccionada.");
    }

    await this.candidateRepository.deleteTrainingRecord(trainingId);
    await this.syncProfileCompletion(userId);

    return {
      message: "Capacitacion eliminada correctamente.",
    };
  }

  async createReferenceRecord(userId: string, payload: UpsertCandidateReferenceDto) {
    const profile = await this.candidateRepository.ensureCandidateProfileForUser(userId);
    const currentCount = await this.candidateRepository.countReferenceRecordsByUserId(userId);

    if (currentCount >= 3) {
      throw new NotFoundException("Solo puedes registrar hasta 3 referencias personales.");
    }

    const record = await this.candidateRepository.createReferenceRecord({
      candidateProfileId: profile.id,
      fullName: payload.fullName.trim(),
      relationship: payload.relationship.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim(),
      city: payload.city.trim(),
    });

    await this.syncProfileCompletion(userId);

    return this.mapReferenceRecord(record);
  }

  async updateReferenceRecord(userId: string, referenceId: string, payload: UpsertCandidateReferenceDto) {
    const existing = await this.candidateRepository.findReferenceRecordForUser(userId, referenceId);

    if (!existing) {
      throw new NotFoundException("No se encontro la referencia seleccionada.");
    }

    const record = await this.candidateRepository.updateReferenceRecord(referenceId, {
      fullName: payload.fullName.trim(),
      relationship: payload.relationship.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim(),
      city: payload.city.trim(),
    });

    await this.syncProfileCompletion(userId);

    return this.mapReferenceRecord(record);
  }

  async deleteReferenceRecord(userId: string, referenceId: string) {
    const existing = await this.candidateRepository.findReferenceRecordForUser(userId, referenceId);

    if (!existing) {
      throw new NotFoundException("No se encontro la referencia seleccionada.");
    }

    const currentCount = await this.candidateRepository.countReferenceRecordsByUserId(userId);

    if (currentCount <= 1) {
      throw new NotFoundException("Debes conservar al menos 1 referencia personal.");
    }

    await this.candidateRepository.deleteReferenceRecord(referenceId);
    await this.syncProfileCompletion(userId);

    return {
      message: "Referencia eliminada correctamente.",
    };
  }

  async getResume(userId: string) {
    const snapshot = await this.candidateRepository.findResumeGraphByUserId(userId);

    if (!snapshot) {
      return {
        profile: null,
        educationRecords: [],
        languageRecords: [],
        trainingRecords: [],
        experienceRecords: [],
        referenceRecords: [],
        documents: [],
      };
    }

    const profileCompletion = await this.syncProfileCompletion(userId);

    return {
      profile: {
        id: snapshot.id,
        userId: snapshot.userId,
        firstName: snapshot.user.firstName,
        lastName: snapshot.user.lastName,
        email: snapshot.user.email,
        city: snapshot.city,
        country: snapshot.country,
        birthDate: snapshot.birthDate?.toISOString().slice(0, 10) ?? null,
        personalInfo: snapshot.personalInfo,
        profileCompletion,
      },
      educationRecords: snapshot.educationRecords.map((record) => this.mapEducationRecord(record)),
      languageRecords: snapshot.languages.map((record) => this.mapLanguageRecord(record)),
      trainingRecords: snapshot.certifications.map((record) => this.mapTrainingRecord(record)),
      experienceRecords: snapshot.workExperiences.map((record) => this.mapExperienceRecord(record)),
      referenceRecords: snapshot.references.map((record) => this.mapReferenceRecord(record)),
      documents: snapshot.documents.map((document) => ({
        id: document.id,
        type: document.type,
        fileName: document.fileName,
        mimeType: document.mimeType,
        size: document.size,
        createdAt: document.createdAt,
      })),
    };
  }

  async getProfile(userId: string) {
    const profile = await this.candidateRepository.findProfileDetailByUserId(userId);

    if (!profile) {
      return {
        profile: null,
      };
    }

    const profileCompletion = await this.syncProfileCompletion(userId);

    return {
      profile: {
        ...profile,
        birthDate: profile.birthDate?.toISOString().slice(0, 10) ?? null,
        profileCompletion,
      },
    };
  }

  async getDashboard(userId: string) {
    const profile = await this.candidateRepository.findProfileByUserId(userId);

    return {
      profile,
      stats: {
        documents: profile?.documents.length ?? 0,
        applications: profile?.applications.length ?? 0,
      },
    };
  }

  async updateProfile(userId: string, payload: UpdateCandidateProfileDto) {
    const personalInfo = payload.personalInfo;

    const profile = await this.candidateRepository.upsertProfile(userId, {
      ...payload,
      city: personalInfo?.canton?.trim() || payload.city,
      country: personalInfo?.addressCountry?.trim() || payload.country,
      birthDate: personalInfo?.birthDate ? new Date(personalInfo.birthDate) : undefined,
      personalInfo: personalInfo ? (personalInfo as Record<string, string>) : undefined,
    });

    const profileCompletion = await this.syncProfileCompletion(userId);

    return {
      ...profile,
      profileCompletion,
    };
  }
}
