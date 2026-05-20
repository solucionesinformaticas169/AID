"use client";

export type PendingCompany = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export type ModerationJob = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED";
  companyId: string;
  companyName: string;
  city: string | null;
  country: string | null;
  createdAt: string;
  reason: string;
};

type ModerationAction = "APPROVE" | "REQUEST_CHANGES";
type ManagedRoleCode = "CANDIDATE" | "RECRUITER" | "SYSTEM_ADMIN";

export type AdminConsoleSummary = {
  usersRegistered: number;
  companiesRegistered: number;
  jobsPublished: number;
  applicationsCount: number;
  paymentsReceived: number;
  activePlansCount: number;
  uploadedDocumentsCount: number;
  securityAlertsCount: number;
};

export type AdminConsoleUser = {
  id: string;
  fullName: string;
  email: string;
  roleCode: string | null;
  isActive: boolean;
  companyName: string | null;
  sessions: number;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type AdminConsoleCompany = {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  city: string | null;
  country: string | null;
  users: number;
  jobs: number;
  subscriptions: number;
  createdAt: string;
};

export type AdminConsoleJob = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED";
  companyName: string;
  applications: number;
  city: string | null;
  country: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type AdminConsoleApplication = {
  id: string;
  status: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  compatibilityScore: number;
  appliedAt: string;
};

export type AdminConsolePayment = {
  id: string;
  provider: string;
  status: string;
  amount: string;
  currency: string;
  companyName: string;
  planName: string;
  paidAt: string | null;
  createdAt: string;
};

export type AdminConsoleInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  currency: string;
  companyName: string;
  planName: string;
  paidAt: string | null;
  issuedAt: string;
};

export type AdminConsoleDocument = {
  id: string;
  fileName: string;
  type: string;
  mimeType: string;
  size: number;
  candidateName: string;
  candidateEmail: string;
  createdAt: string;
};

export type AdminConsoleAuditPreview = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  user: {
    email: string;
    name: string;
  } | null;
  createdAt: string;
};

export type AdminConsoleSecurity = {
  lockedAttempts: Array<{
    id: string;
    email: string;
    ip: string;
    failedCount: number;
    lockedUntil: string | null;
    lastAttemptAt: string;
  }>;
  reusedSessions: Array<{
    id: string;
    email: string;
    name: string;
    ip: string | null;
    userAgent: string | null;
    reuseDetectedAt: string | null;
  }>;
  recentFailedLoginsCount: number;
};

export type AdminConsoleConfiguration = {
  resendConfigured: boolean;
  supabaseConfigured: boolean;
  stripeConfigured: boolean;
  paypalConfigured: boolean;
  payphoneConfigured: boolean;
  auditLogsEnabled: boolean;
  securityHeadersEnabled: boolean;
};

export type AdminConsoleResponse = {
  summary: AdminConsoleSummary;
  users: AdminConsoleUser[];
  companies: AdminConsoleCompany[];
  jobs: AdminConsoleJob[];
  applications: AdminConsoleApplication[];
  payments: AdminConsolePayment[];
  invoices: AdminConsoleInvoice[];
  documents: AdminConsoleDocument[];
  auditPreview: AdminConsoleAuditPreview[];
  security: AdminConsoleSecurity;
  configuration: AdminConsoleConfiguration;
};

export type AuditLogRecord = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: unknown;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type ManagedUserSession = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
};

export type ManagedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  roleCode: ManagedRoleCode | null;
  roleName: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
  } | null;
  activeSessions: ManagedUserSession[];
  activeSessionCount: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    let message = "No se pudo completar la solicitud administrativa.";

    try {
      const payload = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(". ");
      } else if (payload.message) {
        message = payload.message;
      }
    } catch {
      message = `${message} (${response.status})`;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function getPendingCompanies() {
  return request<PendingCompany[]>("/companies/pending");
}

export function getAdminConsole() {
  return request<AdminConsoleResponse>("/console");
}

export function approveCompany(companyId: string) {
  return request<PendingCompany>(`/companies/${companyId}/approve`, {
    method: "PATCH",
  });
}

export function getModerationJobs() {
  return request<ModerationJob[]>("/jobs/moderation");
}

export function moderateJob(jobId: string, action: ModerationAction) {
  return request<{ message: string; job: ModerationJob }>(`/jobs/${jobId}/moderation`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export function getAdminUsers(roleCode: ManagedRoleCode) {
  return request<ManagedUser[]>(`/users?roleCode=${roleCode}`);
}

export function updateAdminUserStatus(userId: string, isActive: boolean) {
  return request<{ message: string; user: ManagedUser }>(`/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export function getAdminUserSessions(userId: string) {
  return request<ManagedUserSession[]>(`/users/${userId}/sessions`);
}

export function revokeAdminUserSession(userId: string, sessionId: string) {
  return request<{ message: string }>(`/users/${userId}/sessions/${sessionId}/revoke`, {
    method: "PATCH",
  });
}

export function revokeAllAdminUserSessions(userId: string) {
  return request<{ message: string }>(`/users/${userId}/sessions/revoke-all`, {
    method: "PATCH",
  });
}

export function getAuditLogs(filters?: Record<string, string>) {
  const search = filters ? new URLSearchParams(filters).toString() : "";
  return request<AuditLogRecord[]>(`/audit-logs${search ? `?${search}` : ""}`);
}
