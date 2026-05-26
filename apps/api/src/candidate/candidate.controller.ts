import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { ROLE_CODES } from "../common/constants/role-codes";
import { UpdateCandidateProfileDto } from "./dto/update-candidate-profile.dto";
import { UpsertCandidateEducationDto } from "./dto/upsert-candidate-education.dto";
import { UpsertCandidateExperienceDto } from "./dto/upsert-candidate-experience.dto";
import { UpsertCandidateLanguageDto } from "./dto/upsert-candidate-language.dto";
import { UpsertCandidateReferenceDto } from "./dto/upsert-candidate-reference.dto";
import { UpsertCandidateTrainingDto } from "./dto/upsert-candidate-training.dto";
import { CandidateService } from "./candidate.service";

@Roles(ROLE_CODES.CANDIDATE)
@Controller("candidate")
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get("profile")
  getProfile(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getProfile(user.sub);
  }

  @Get("resume")
  getResume(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getResume(user.sub);
  }

  @Get("education")
  getEducationRecords(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getEducationRecords(user.sub);
  }

  @Get("experience")
  getExperienceRecords(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getExperienceRecords(user.sub);
  }

  @Get("languages")
  getLanguageRecords(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getLanguageRecords(user.sub);
  }

  @Get("trainings")
  getTrainingRecords(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getTrainingRecords(user.sub);
  }

  @Get("references")
  getReferenceRecords(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getReferenceRecords(user.sub);
  }

  @Get("dashboard")
  getDashboard(@CurrentUser() user: { sub: string }) {
    return this.candidateService.getDashboard(user.sub);
  }

  @Patch("profile")
  updateProfile(@CurrentUser() user: { sub: string }, @Body() payload: UpdateCandidateProfileDto) {
    return this.candidateService.updateProfile(user.sub, payload);
  }

  @Post("education")
  createEducationRecord(@CurrentUser() user: { sub: string }, @Body() payload: UpsertCandidateEducationDto) {
    return this.candidateService.createEducationRecord(user.sub, payload);
  }

  @Patch("education/:educationId")
  updateEducationRecord(
    @CurrentUser() user: { sub: string },
    @Param("educationId") educationId: string,
    @Body() payload: UpsertCandidateEducationDto,
  ) {
    return this.candidateService.updateEducationRecord(user.sub, educationId, payload);
  }

  @Delete("education/:educationId")
  deleteEducationRecord(@CurrentUser() user: { sub: string }, @Param("educationId") educationId: string) {
    return this.candidateService.deleteEducationRecord(user.sub, educationId);
  }

  @Post("experience")
  createExperienceRecord(@CurrentUser() user: { sub: string }, @Body() payload: UpsertCandidateExperienceDto) {
    return this.candidateService.createExperienceRecord(user.sub, payload);
  }

  @Patch("experience/:experienceId")
  updateExperienceRecord(
    @CurrentUser() user: { sub: string },
    @Param("experienceId") experienceId: string,
    @Body() payload: UpsertCandidateExperienceDto,
  ) {
    return this.candidateService.updateExperienceRecord(user.sub, experienceId, payload);
  }

  @Delete("experience/:experienceId")
  deleteExperienceRecord(@CurrentUser() user: { sub: string }, @Param("experienceId") experienceId: string) {
    return this.candidateService.deleteExperienceRecord(user.sub, experienceId);
  }

  @Post("languages")
  createLanguageRecord(@CurrentUser() user: { sub: string }, @Body() payload: UpsertCandidateLanguageDto) {
    return this.candidateService.createLanguageRecord(user.sub, payload);
  }

  @Patch("languages/:languageId")
  updateLanguageRecord(
    @CurrentUser() user: { sub: string },
    @Param("languageId") languageId: string,
    @Body() payload: UpsertCandidateLanguageDto,
  ) {
    return this.candidateService.updateLanguageRecord(user.sub, languageId, payload);
  }

  @Delete("languages/:languageId")
  deleteLanguageRecord(@CurrentUser() user: { sub: string }, @Param("languageId") languageId: string) {
    return this.candidateService.deleteLanguageRecord(user.sub, languageId);
  }

  @Post("trainings")
  createTrainingRecord(@CurrentUser() user: { sub: string }, @Body() payload: UpsertCandidateTrainingDto) {
    return this.candidateService.createTrainingRecord(user.sub, payload);
  }

  @Patch("trainings/:trainingId")
  updateTrainingRecord(
    @CurrentUser() user: { sub: string },
    @Param("trainingId") trainingId: string,
    @Body() payload: UpsertCandidateTrainingDto,
  ) {
    return this.candidateService.updateTrainingRecord(user.sub, trainingId, payload);
  }

  @Delete("trainings/:trainingId")
  deleteTrainingRecord(@CurrentUser() user: { sub: string }, @Param("trainingId") trainingId: string) {
    return this.candidateService.deleteTrainingRecord(user.sub, trainingId);
  }

  @Post("references")
  createReferenceRecord(@CurrentUser() user: { sub: string }, @Body() payload: UpsertCandidateReferenceDto) {
    return this.candidateService.createReferenceRecord(user.sub, payload);
  }

  @Patch("references/:referenceId")
  updateReferenceRecord(
    @CurrentUser() user: { sub: string },
    @Param("referenceId") referenceId: string,
    @Body() payload: UpsertCandidateReferenceDto,
  ) {
    return this.candidateService.updateReferenceRecord(user.sub, referenceId, payload);
  }

  @Delete("references/:referenceId")
  deleteReferenceRecord(@CurrentUser() user: { sub: string }, @Param("referenceId") referenceId: string) {
    return this.candidateService.deleteReferenceRecord(user.sub, referenceId);
  }
}
