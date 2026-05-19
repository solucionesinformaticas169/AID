import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { PlansService } from "../plans/plans.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { JobsRepository } from "./repositories/jobs.repository";

@Injectable()
export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly plansService: PlansService,
  ) {}

  getPublicJobs() {
    return this.jobsRepository.findPublicJobs();
  }

  async getJobBySlug(slug: string) {
    const job = await this.jobsRepository.findBySlug(slug);

    if (!job) {
      throw new NotFoundException(`Vacante ${slug} no encontrada.`);
    }

    return job;
  }

  async createJob(payload: CreateJobDto) {
    if (!payload.companyId || !payload.createdByUserId || !payload.title || !payload.description) {
      throw new BadRequestException("Datos incompletos para crear la vacante.");
    }

    const company = await this.jobsRepository.findCompanyById(payload.companyId);

    if (!company) {
      throw new NotFoundException(`Empresa ${payload.companyId} no encontrada.`);
    }

    const planStatus = await this.plansService.assertCompanyCanPublish(payload.companyId);
    const freePublication = planStatus.freePostsRemaining > 0;
    const slug = await this.generateUniqueSlug(payload.title);

    if (freePublication) {
      await this.jobsRepository.incrementFreePostsUsed(payload.companyId);
    }

    const job = await this.jobsRepository.createJob({
      ...payload,
      slug,
      freePublication,
      priorityPublication: planStatus.priorityPublication,
    });

    return {
      message: freePublication
        ? "Vacante publicada usando una carga gratuita."
        : "Vacante publicada con suscripcion activa.",
      job,
      planStatus: await this.plansService.getCompanyPlanStatus(payload.companyId),
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
}
