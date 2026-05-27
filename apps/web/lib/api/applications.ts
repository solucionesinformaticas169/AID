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

export type CreateApplicationPayload = {
  jobOfferId: string;
  coverLetter?: string;
  selectedEducationIds: string[];
  selectedWorkExperienceIds: string[];
  selectedCertificationIds: string[];
};

export type CompanyApplicationStatus = {
  status: "APPLIED" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW" | "REJECTED" | "HIRED";
  total: number;
  averageCompatibility: number;
};

export type CompanyApplicationStatistics = {
  totalApplications: number;
  averageCompatibility: number;
  byStatus: CompanyApplicationStatus[];
  recentApplications: Array<{
    id: string;
    status: string;
    compatibilityScore: number;
    appliedAt: string;
    candidate: {
      id: string;
      profileId: string;
      name: string;
      email: string;
    };
    jobOffer: {
      id: string;
      title: string;
      companyId: string;
    };
    timelineEntries: CandidateApplicationTimelineEntry[];
  }>;
};

export type CompanyJobApplicant = {
  id: string;
  status: string;
  compatibilityScore: number;
  appliedAt: string;
  candidate: {
    id: string;
    profileId: string;
    name: string;
    email: string;
    resume: {
      city: string | null;
      country: string | null;
      profileCompletion: number;
      personalInfo: Record<string, string> | null;
      educationRecords: Array<{
        id: string;
        level: string;
        institution: string;
        title: string;
        studyArea: string;
        graduationYear: string;
      }>;
      languageRecords: Array<{
        id: string;
        language: string;
        spokenLevel: string;
        writtenLevel: string;
      }>;
      trainingRecords: Array<{
        id: string;
        institution: string;
        eventType: string;
        eventName: string;
        studyArea: string;
        certificationType: string;
        startDate: string;
        endDate: string;
      }>;
      experienceRecords: Array<{
        id: string;
        company: string;
        position: string;
        department: string;
        startDate: string;
        endDate: string;
        currentlyWorking: string;
        city: string;
        responsibilities: string;
        achievements: string;
      }>;
      referenceRecords: Array<{
        id: string;
        fullName: string;
        relationship: string;
        phone: string;
        email: string;
        city: string;
      }>;
    };
  };
  jobOffer: {
    id: string;
    title: string;
    companyId: string;
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

export async function createApplication(payload: CreateApplicationPayload) {
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<CandidateApplication>(response);
}

export async function getCompanyApplicationStatistics(companyId: string) {
  const response = await fetch(`/api/applications/company/${companyId}/statistics`, {
    cache: "no-store",
    credentials: "include",
  });

  return parseJsonResponse<CompanyApplicationStatistics>(response);
}

export async function getJobApplications(jobId: string) {
  const response = await fetch(`/api/applications/job/${jobId}`, {
    cache: "no-store",
    credentials: "include",
  });

  return parseJsonResponse<CompanyJobApplicant[]>(response);
}

export async function updateApplicationStatus(
  applicationId: string,
  payload: {
    status: CompanyApplicationStatus["status"];
    note?: string;
  },
) {
  const response = await fetch(`/api/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<{
    id: string;
    status: string;
    timelineEntries: CandidateApplicationTimelineEntry[];
  }>(response);
}
