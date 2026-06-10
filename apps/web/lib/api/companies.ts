"use client";

export type CompanyProfileResponse = {
  company: {
    id: string;
    name: string;
    commercialName: string | null;
    taxId: string | null;
    city: string | null;
    country: string | null;
    address: string | null;
    website: string | null;
    logoPath: string | null;
    industry: string | null;
    contactPosition: string | null;
    billingEmail: string | null;
    status: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
};

export type UpdateCompanyProfilePayload = {
  name: string;
  commercialName?: string;
  taxId?: string;
  city?: string;
  country?: string;
  address?: string;
  website?: string;
  industry?: string;
  contactPosition?: string;
  billingEmail?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type PublicCompanyLogo = {
  id: string;
  name: string;
  legalName: string;
  website: string | null;
  city: string | null;
  country: string | null;
};

export type CompanyDashboardFallbackResponse = {
  company: {
    id: string;
    name: string;
    commercialName: string | null;
    taxId: string | null;
    city: string | null;
    country: string | null;
    address: string | null;
    website: string | null;
    logoPath: string | null;
    industry: string | null;
    contactPosition: string | null;
    billingEmail: string | null;
    status: string;
    companyUsers?: Array<{
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
      } | null;
    }>;
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    let message = "No se pudo completar la solicitud.";

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

export function getCompanyProfile(companyId: string) {
  return request<CompanyProfileResponse>(`/api/companies/${companyId}/profile`);
}

export function getCompanyDashboardFallback(companyId: string) {
  return request<CompanyDashboardFallbackResponse>(`/api/companies/${companyId}/dashboard`);
}

export function updateCompanyProfile(companyId: string, payload: UpdateCompanyProfilePayload) {
  return request<CompanyProfileResponse>(`/api/companies/${companyId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadCompanyLogo(companyId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<{ message: string; company: { id: string; logoPath: string | null } }>(
    `/api/companies/${companyId}/logo`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export function getPublicCompanyLogos() {
  return request<PublicCompanyLogo[]>("/api/public/company-logos");
}
