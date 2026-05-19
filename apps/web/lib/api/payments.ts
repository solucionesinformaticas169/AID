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

const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const BILLING_PROXY_BASE_URL = "/api/billing";

function buildApiUrl(path: string) {
  return `${PUBLIC_API_BASE_URL}${path}`;
}

function buildBillingProxyUrl(path: string) {
  return `${BILLING_PROXY_BASE_URL}${path}`;
}

async function request<T>(path: string, init?: RequestInit, options?: { proxy?: "billing" | "public" }): Promise<T> {
  const baseUrl =
    options?.proxy === "billing" ? buildBillingProxyUrl(path) : buildApiUrl(path);
  const response = await fetch(baseUrl, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    credentials: "include",
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
  return BILLING_PROXY_BASE_URL;
}

export function getCompanyBillingSummary(companyId: string) {
  return request<BillingSummaryResponse>(`/company/${companyId}/billing-summary`, undefined, {
    proxy: "billing",
  });
}

export function getCompanyPayments(companyId: string) {
  return request<CompanyPayment[]>(`/company/${companyId}`, undefined, {
    proxy: "billing",
  });
}

export function getCompanyInvoices(companyId: string) {
  return request<CompanyInvoice[]>(`/company/${companyId}/invoices`, undefined, {
    proxy: "billing",
  });
}

export function getPlans() {
  return request<PersistedPlan[]>("/plans");
}

export function createCheckout(payload: CheckoutPayload) {
  return request<CheckoutResponse>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  }, {
    proxy: "billing",
  });
}
