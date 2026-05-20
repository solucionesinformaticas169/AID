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
    const shouldPublishImmediately = user.role === ROLE_CODES.SYSTEM_ADMIN;
    const initialStatus = shouldPublishImmediately ? JobOfferStatus.PUBLISHED : JobOfferStatus.DRAFT;

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
      publishedAt: shouldPublishImmediately ? new Date() : null,
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

    if (shouldPublishImmediately) {
      this.notifyCompanyJobPublished({
        ...job,
        company: {
          name: company.name,
          companyUsers: company.companyUsers,
        },
      });
    }

    return {
      message: shouldPublishImmediately
        ? freePublication
          ? "Vacante publicada usando una carga gratuita."
          : "Vacante publicada con suscripcion activa."
        : "Vacante creada y enviada a moderacion administrativa.",
      job,
      planStatus: await this.plansService.getCompanyPlanStatus(effectiveCompanyId),
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
