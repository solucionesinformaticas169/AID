export type PublicJob = {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements?: string | null;
  responsibilities?: string | null;
  benefits?: string | null;
  city?: string | null;
  country?: string | null;
  modality?: "ON_SITE" | "HYBRID" | "REMOTE" | null;
  employmentType?:
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "TEMPORARY"
    | "INTERNSHIP"
    | "FREELANCE"
    | null;
  requiredEducationLevel?: string | null;
  minimumYearsExperience?: number;
  requiredLanguages?: string[] | null;
  requiredCertifications?: string[] | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status: string;
  freePublication: boolean;
  priorityPublication: boolean;
  publishedAt?: string | null;
  closesAt?: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    city?: string | null;
    country?: string | null;
  };
};

export type CreateJobPayload = {
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  city?: string;
  country?: string;
  requiredEducationLevel?: string;
  minimumYearsExperience?: number;
  requiredLanguages?: string[];
  requiredCertifications?: string[];
  salaryMin?: number;
  salaryMax?: number;
  publishedAt?: string;
  closesAt?: string;
};

export type CompanyJob = {
  id: string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
  benefits?: string | null;
  city?: string | null;
  country?: string | null;
  status: string;
  createdAt: string;
  publishedAt?: string | null;
  requiredEducationLevel?: string | null;
  minimumYearsExperience: number;
  requiredLanguages?: string[] | null;
  requiredCertifications?: string[] | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  closesAt?: string | null;
  _count: {
    applications: number;
  };
};

export async function getPublicJobs() {
  const response = await fetch("/api/jobs/public", {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as PublicJob[] | { message?: string };

  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "No se pudieron cargar las ofertas.",
    );
  }

  return payload as PublicJob[];
}

export async function createJob(payload: CreateJobPayload) {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const responsePayload = (await response.json()) as
    | {
        message?: string;
        job?: PublicJob;
      }
    | { message?: string | string[] };

  if (!response.ok) {
    const message =
      typeof responsePayload === "object" &&
      responsePayload &&
      "message" in responsePayload
        ? Array.isArray(responsePayload.message)
          ? responsePayload.message.join(". ")
          : responsePayload.message ?? "No se pudo crear la vacante."
        : "No se pudo crear la vacante.";

    throw new Error(message);
  }

  return responsePayload as { message: string; job: PublicJob };
}

export async function getCompanyJobs(companyId: string) {
  const response = await fetch(`/api/jobs/company/${companyId}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  const payload = (await response.json()) as CompanyJob[] | { message?: string | string[] };

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(". ")
          : payload.message ?? "No se pudieron cargar las vacantes."
        : "No se pudieron cargar las vacantes.";

    throw new Error(message);
  }

  return payload as CompanyJob[];
}

export async function updateJob(jobId: string, payload: Partial<CreateJobPayload>) {
  const response = await fetch(`/api/jobs/${jobId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const responsePayload = (await response.json()) as
    | {
        message?: string;
        job?: CompanyJob;
      }
    | { message?: string | string[] };

  if (!response.ok) {
    const message =
      typeof responsePayload === "object" &&
      responsePayload &&
      "message" in responsePayload
        ? Array.isArray(responsePayload.message)
          ? responsePayload.message.join(". ")
          : responsePayload.message ?? "No se pudo actualizar la vacante."
        : "No se pudo actualizar la vacante.";

    throw new Error(message);
  }

  return responsePayload as { message: string; job: CompanyJob };
}

export async function updateJobVisibility(jobId: string, isActive: boolean) {
  const response = await fetch(`/api/jobs/${jobId}/visibility`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ isActive }),
  });

  const responsePayload = (await response.json()) as
    | {
        message?: string;
        job?: CompanyJob;
      }
    | { message?: string | string[] };

  if (!response.ok) {
    const message =
      typeof responsePayload === "object" &&
      responsePayload &&
      "message" in responsePayload
        ? Array.isArray(responsePayload.message)
          ? responsePayload.message.join(". ")
          : responsePayload.message ?? "No se pudo actualizar la vacante."
        : "No se pudo actualizar la vacante.";

    throw new Error(message);
  }

  return responsePayload as { message: string; job: CompanyJob };
}
