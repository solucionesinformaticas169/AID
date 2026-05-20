"use client";

export type CandidateApplicationTimelineEntry = {
  id: string;
  status: string;
  title: string;
  description: string | null;
  createdAt: string;
};

export type CandidateApplication = {
  id: string;
  status: string;
  compatibilityScore: number;
  appliedAt: string;
  jobOffer: {
    id: string;
    title: string;
    city: string | null;
    country: string | null;
    company?: {
      name: string;
    } | null;
  };
  timelineEntries: CandidateApplicationTimelineEntry[];
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(". ")
      : payload.message ?? "No se pudo completar la operacion.";

    throw new Error(message);
  }

  return payload;
}

export async function getMyApplications() {
  const response = await fetch("/api/applications/me", {
    cache: "no-store",
    credentials: "include",
  });

  return parseJsonResponse<CandidateApplication[]>(response);
}

