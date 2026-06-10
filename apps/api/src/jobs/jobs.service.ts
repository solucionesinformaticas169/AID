import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JobOfferStatus } from "@prisma/client";

import { AuditService } from "../audit/audit.service";
import { AUDIT_ENTITY_TYPES } from "../audit/audit.constants";
import {
  JOB_MODERATION_ACTIONS,
  type JobModerationAction,
} from "../admin/dto/update-job-moderation.dto";
import { ROLE_CODES } from "../common/constants/role-codes";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { EmailsService } from "../emails/emails.service";
import { AppLoggerService } from "../observability/app-logger.service";
import { PlansService } from "../plans/plans.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { UpdateJobVisibilityDto } from "./dto/update-job-visibility.dto";
import { JobsRepository } from "./repositories/jobs.repository";

@Injectable()
export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly plansService: PlansService,
    private readonly emailsService: EmailsService,
    private readonly auditService: AuditService,
    private readonly logger: AppLoggerService,
  ) {}

  getPublicJobs() {
    return this.jobsRepository.findPublicJobs();
  }

  async getCompanyJobs(user: AuthenticatedUser, companyId: string) {
    if (user.role !== ROLE_CODES.SYSTEM_ADMIN) {
      const hasMembership = await this.jobsRepository.userHasCompanyAccess(user.sub, companyId);

      if (!hasMembership || user.companyId !== companyId) {
        throw new ForbiddenException("No tienes acceso a vacantes de otra empresa.");
      }
    }

    return this.jobsRepository.findByCompanyId(companyId);
  }

  async getModerationQueue() {
    const jobs = await this.jobsRepository.findPendingModerationJobs();

    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      companyId: job.companyId,
      companyName: job.company.name,
      city: job.city,
      country: job.country,
      createdAt: job.createdAt,
      reason: this.getModerationReason(job),
    }));
  }

  async getJobBySlug(slug: string) {
    const job = await this.jobsRepository.findBySlug(slug);

    if (!job) {
      throw new NotFoundException(`Vacante ${slug} no encontrada.`);
    }

    return job;
  }

  async createJob(user: AuthenticatedUser, payload: CreateJobDto) {
    const effectiveCompanyId =
      user.role === ROLE_CODES.SYSTEM_ADMIN ? payload.companyId : user.companyId;

    if (!effectiveCompanyId || !payload.title || !payload.description) {
      throw new BadRequestException("Datos incompletos para crear la vacante.");
    }

    if (user.role !== ROLE_CODES.SYSTEM_ADMIN) {
      const hasMembership = await this.jobsRepository.userHasCompanyAccess(user.sub, effectiveCompanyId);

      if (!hasMembership) {
        throw new ForbiddenException("No puedes publicar vacantes para otra empresa.");
      }
    }

    const company = await this.jobsRepository.findCompanyById(effectiveCompanyId);

    if (!company) {
      throw new NotFoundException(`Empresa ${effectiveCompanyId} no encontrada.`);
    }

    const planStatus = await this.plansService.assertCompanyCanPublish(effectiveCompanyId);
    const freePublication = planStatus.freePostsRemaining > 0;
    const slug = await this.generateUniqueSlug(payload.title);
    const initialStatus = JobOfferStatus.PUBLISHED;
    const availability = this.resolveAvailability(payload.publishedAt, payload.closesAt);
    const salary = this.resolveSalaryRange(payload.salaryMin, payload.salaryMax);

    if (freePublication) {
      await this.jobsRepository.incrementFreePostsUsed(effectiveCompanyId);
    }

    const job = await this.jobsRepository.createJob({
      ...payload,
      companyId: effectiveCompanyId,
      createdByUserId: user.sub,
      slug,
      freePublication,
      priorityPublication: planStatus.priorityPublication,
      status: initialStatus,
      publishedAt: availability.publishedAt ?? new Date(),
      closesAt: availability.closesAt,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
    });
    await this.auditService.record({
      action: "JOB_CREATED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.JOB_OFFER,
      entityId: job.id,
      metadata: {
        companyId: effectiveCompanyId,
        title: job.title,
        freePublication,
        priorityPublication: planStatus.priorityPublication,
      },
    });
    this.logger.info("Job created successfully", {
      context: JobsService.name,
      event: "JOB_CREATED",
      action: "JOB_CREATED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.JOB_OFFER,
      entityId: job.id,
      companyId: effectiveCompanyId,
      freePublication,
      priorityPublication: planStatus.priorityPublication,
    });

    this.notifyCompanyJobPublished({
      ...job,
      company: {
        name: company.name,
        companyUsers: company.companyUsers,
      },
    });

    return {
      message: freePublication
        ? "Vacante publicada usando una carga gratuita."
        : "Vacante publicada con suscripcion activa.",
      job,
      planStatus: await this.plansService.getCompanyPlanStatus(effectiveCompanyId),
    };
  }

  async updateJob(user: AuthenticatedUser, jobId: string, payload: UpdateJobDto) {
    const existingJob = await this.jobsRepository.findById(jobId);

    if (!existingJob) {
      throw new NotFoundException(`Vacante ${jobId} no encontrada.`);
    }

    if (user.role !== ROLE_CODES.SYSTEM_ADMIN) {
      const hasMembership = await this.jobsRepository.userHasCompanyAccess(
        user.sub,
        existingJob.companyId,
      );

      if (!hasMembership || user.companyId !== existingJob.companyId) {
        throw new ForbiddenException("No puedes editar vacantes de otra empresa.");
      }
    }

    if (!payload.title && !payload.description && Object.keys(payload).length === 0) {
      throw new BadRequestException("Debes enviar al menos un cambio para actualizar la vacante.");
    }

    const availability = this.resolveAvailability(
      payload.publishedAt ?? existingJob.publishedAt?.toISOString(),
      payload.closesAt ?? existingJob.closesAt?.toISOString(),
    );
    const salary = this.resolveSalaryRange(
      payload.salaryMin ?? this.toNullableNumber(existingJob.salaryMin),
      payload.salaryMax ?? this.toNullableNumber(existingJob.salaryMax),
    );

    const updatedJob = await this.jobsRepository.updateJob(jobId, {
      ...payload,
      publishedAt: availability.publishedAt,
      closesAt: availability.closesAt,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
    });

    this.logger.info("Job updated successfully", {
      context: JobsService.name,
      event: "JOB_UPDATED",
      action: "JOB_UPDATED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.JOB_OFFER,
      entityId: updatedJob.id,
      companyId: existingJob.companyId,
    });

    return {
      message: "Vacante actualizada correctamente.",
      job: updatedJob,
    };
  }

  async updateJobVisibility(
    user: AuthenticatedUser,
    jobId: string,
    payload: UpdateJobVisibilityDto,
  ) {
    const existingJob = await this.jobsRepository.findById(jobId);

    if (!existingJob) {
      throw new NotFoundException(`Vacante ${jobId} no encontrada.`);
    }

    if (user.role !== ROLE_CODES.SYSTEM_ADMIN) {
      const hasMembership = await this.jobsRepository.userHasCompanyAccess(
        user.sub,
        existingJob.companyId,
      );

      if (!hasMembership || user.companyId !== existingJob.companyId) {
        throw new ForbiddenException("No puedes cambiar el estado de vacantes de otra empresa.");
      }
    }

    const nextStatus = payload.isActive ? JobOfferStatus.PUBLISHED : JobOfferStatus.PAUSED;
    const publishedAt =
      nextStatus === JobOfferStatus.PUBLISHED
        ? existingJob.publishedAt ?? new Date()
        : existingJob.publishedAt;

    if (
      nextStatus === JobOfferStatus.PUBLISHED &&
      existingJob.closesAt &&
      existingJob.closesAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        "La fecha de cierre ya expiro. Actualiza la disponibilidad antes de activar la vacante.",
      );
    }

    const updatedJob = await this.jobsRepository.updateStatus(jobId, nextStatus, publishedAt);

    this.logger.info("Job visibility updated successfully", {
      context: JobsService.name,
      event: "JOB_VISIBILITY_UPDATED",
      action: "JOB_VISIBILITY_UPDATED",
      userId: user.sub,
      entityType: AUDIT_ENTITY_TYPES.JOB_OFFER,
      entityId: updatedJob.id,
      companyId: existingJob.companyId,
      previousStatus: existingJob.status,
      nextStatus,
    });

    return {
      message:
        nextStatus === JobOfferStatus.PUBLISHED
          ? "Vacante activada correctamente."
          : "Vacante desactivada correctamente.",
      job: updatedJob,
    };
  }

  async moderateJob(jobId: string, action: JobModerationAction, reviewerUserId: string) {
    const existingJob = await this.jobsRepository.findById(jobId);

    if (!existingJob) {
      throw new NotFoundException(`Vacante ${jobId} no encontrada.`);
    }

    const nextStatus =
      action === JOB_MODERATION_ACTIONS.APPROVE ? JobOfferStatus.PUBLISHED : JobOfferStatus.PAUSED;

    const updatedJob = await this.jobsRepository.updateModerationStatus(jobId, nextStatus);

    this.logger.info("Job moderation processed", {
      context: JobsService.name,
      event: "JOB_MODERATED",
      action,
      userId: reviewerUserId,
      entityType: AUDIT_ENTITY_TYPES.JOB_OFFER,
      entityId: updatedJob.id,
      companyId: updatedJob.companyId,
      previousStatus: existingJob.status,
      nextStatus,
    });

    if (nextStatus === JobOfferStatus.PUBLISHED) {
      this.notifyCompanyJobPublished(updatedJob);
    }

    return {
      message:
        nextStatus === JobOfferStatus.PUBLISHED
          ? "Vacante aprobada y publicada."
          : "Vacante marcada para ajustes antes de publicarse.",
      job: updatedJob,
    };
  }

  private async generateUniqueSlug(title: string) {
    const baseSlug =
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60) || "vacante";

    let counter = 0;

    while (true) {
      const slug = counter === 0 ? baseSlug : `${baseSlug}-${counter + 1}`;
      const existingJob = await this.jobsRepository.findJobBySlug(slug);

      if (!existingJob) {
        return slug;
      }

      counter += 1;
    }
  }

  private getModerationReason(job: {
    status: JobOfferStatus;
    salaryMin: unknown;
    salaryMax: unknown;
    requiredLanguages: unknown;
    requiredCertifications: unknown;
    minimumYearsExperience: number;
  }) {
    if (job.status === JobOfferStatus.PAUSED) {
      return "Ajustes solicitados por administracion";
    }

    if (!job.salaryMin && !job.salaryMax) {
      return "Validacion salarial";
    }

    if (Array.isArray(job.requiredCertifications) && job.requiredCertifications.length > 0) {
      return "Revision de requisitos";
    }

    if (Array.isArray(job.requiredLanguages) && job.requiredLanguages.length > 0) {
      return "Verificacion de idiomas requeridos";
    }

    if (job.minimumYearsExperience > 5) {
      return "Control de requisitos";
    }

    return "Revision de contenido";
  }

  private resolveSalaryRange(salaryMin?: number | null, salaryMax?: number | null) {
    const normalizedMin = salaryMin ?? null;
    const normalizedMax = salaryMax ?? null;

    if (
      normalizedMin !== null &&
      normalizedMax !== null &&
      normalizedMax < normalizedMin
    ) {
      throw new BadRequestException(
        "La remuneracion maxima no puede ser menor a la remuneracion minima.",
      );
    }

    return {
      salaryMin: normalizedMin,
      salaryMax: normalizedMax,
    };
  }

  private resolveAvailability(publishedAt?: string | null, closesAt?: string | null) {
    const startDate = publishedAt ? new Date(publishedAt) : null;
    const endDate = closesAt ? new Date(closesAt) : null;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException("La fecha de inicio de publicacion no es valida.");
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("La fecha de cierre de la vacante no es valida.");
    }

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException(
        "La fecha final de visibilidad no puede ser anterior a la fecha inicial.",
      );
    }

    return {
      publishedAt: startDate,
      closesAt: endDate,
    };
  }

  private toNullableNumber(value: unknown) {
    if (value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private notifyCompanyJobPublished(job: {
    id: string;
    title: string;
    slug: string;
    company: {
      name: string;
      companyUsers: Array<{
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        };
      }>;
    };
  }) {
    void Promise.allSettled(
      job.company.companyUsers.map((companyUser) =>
        this.emailsService.sendJobPublishedEmail({
          userId: companyUser.user.id,
          recipientEmail: companyUser.user.email,
          recipientName: `${companyUser.user.firstName} ${companyUser.user.lastName}`.trim(),
          jobTitle: job.title,
          companyName: job.company.name,
          dashboardUrl: this.emailsService.buildCompanyDashboardUrl(),
          publicJobUrl: this.emailsService.buildPublicJobUrl(job.slug),
          jobId: job.id,
        }),
      ),
    );
  }
}
