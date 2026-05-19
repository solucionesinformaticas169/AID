"use client";

export type BillingPlanStatus = {
  companyId: string;
  activePlan: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
  activePlanName: string;
  freePostsIncluded: number;
  freePostsUsed: number;
  freePostsRemaining: number;
  publishedJobsCount: number;
  jobPostLimit: number | null;
  availableJobSlots: number | null;
  priorityPublication: boolean;
  advancedMetrics: boolean;
  featuredCandidates: boolean;
  hasActiveSubscription: boolean;
  canPublish: boolean;
  publicationRule: string;
  subscription: {
    id: string;
    code: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
    name: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
  } | null;
};

export type CompanyPayment = {
  id: string;
  provider: "STRIPE" | "PAYPAL" | "PAYPHONE";
  amount: string | number;
  currency: string;
  status: string;
  method: string;
  externalReference: string | null;
  providerPaymentId: string | null;
  checkoutUrl: string | null;
  receiptUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  subscription: {
    id: string;
    plan: {
      id: string;
      code: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
      name: string;
    };
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  } | null;
};

export type CompanyInvoice = {
  id: string;
  provider: "STRIPE" | "PAYPAL" | "PAYPHONE";
  status: string;
  invoiceNumber: string;
  externalInvoiceId: string | null;
  invoicePdfPath: string | null;
  invoiceUrl: string | null;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  currency: string;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  plan: {
    id: string;
    code: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
    name: string;
  };
  payment?: {
    id: string;
    status: string;
  } | null;
};

export type BillingSummaryResponse = {
  planStatus: BillingPlanStatus;
  payments: CompanyPayment[];
  invoices: CompanyInvoice[];
};

export type PersistedPlan = {
  id: string;
  code: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
  name: string;
  description: string | null;
  price: string | number;
  currency: string;
  durationMonths: number;
  jobPostLimit: number | null;
  priorityPublication: boolean;
  advancedMetrics: boolean;
  featuredCandidates: boolean;
  includesFreePosts: boolean;
  freeJobPostsIncluded: number;
  isActive: boolean;
};

export type CheckoutResponse = {
  message: string;
  checkout: {
    provider: "STRIPE" | "PAYPAL" | "PAYPHONE";
    externalReference: string;
    providerPaymentId?: string | null;
    checkoutUrl?: string | null;
  };
  subscriptionId: string;
  paymentId: string;
  invoiceId: string;
  plan: PersistedPlan;
};

export type CheckoutPayload = {
  companyId: string;
  planCode: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
  provider: "STRIPE" | "PAYPAL" | "PAYPHONE";
  customerEmail?: string;
  payerPhoneNumber?: string;
  payerCountryCode?: string;
  successUrl?: string;
  cancelUrl?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "No se pudo completar la solicitud al backend.";

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

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getCompanyBillingSummary(companyId: string) {
  return request<BillingSummaryResponse>(`/payments/company/${companyId}/billing-summary`);
}

export function getCompanyPayments(companyId: string) {
  return request<CompanyPayment[]>(`/payments/company/${companyId}`);
}

export function getCompanyInvoices(companyId: string) {
  return request<CompanyInvoice[]>(`/payments/company/${companyId}/invoices`);
}

export function getPlans() {
  return request<PersistedPlan[]>("/plans");
}

export function createCheckout(payload: CheckoutPayload) {
  return request<CheckoutResponse>("/payments/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
