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
