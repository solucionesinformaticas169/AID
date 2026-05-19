export const ROLE_CODES = {
  CANDIDATE: "CANDIDATE",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  RECRUITER: "RECRUITER",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
