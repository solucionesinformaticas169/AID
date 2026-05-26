export const PaymentProviderCode = {
  STRIPE: "STRIPE",
  PAYPAL: "PAYPAL",
  PAYPHONE: "PAYPHONE",
} as const;

export type PaymentProviderCode =
  (typeof PaymentProviderCode)[keyof typeof PaymentProviderCode];

export type PaymentCheckoutResult = {
  provider: PaymentProviderCode;
  externalReference: string;
  providerPaymentId?: string | null;
  checkoutUrl?: string | null;
  providerPayload?: Record<string, unknown>;
};

export type PaymentCheckoutInput = {
  companyId: string;
  planCode: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
  planName: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  payerPhoneNumber?: string;
  payerCountryCode?: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingCompanyName?: string;
  billingContactPhone?: string;
  billingTaxId?: string;
  billingAddress?: string;
  billingCity?: string;
  billingCountry?: string;
};
