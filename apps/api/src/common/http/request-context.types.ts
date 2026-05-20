export interface RequestContextSnapshot {
  requestId: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  userId?: string | null;
  userRole?: string | null;
  companyId?: string | null;
}

export interface AuthenticatedRequestUser {
  sub: string;
  email: string;
  role: string;
  companyId?: string | null;
  sessionId?: string | null;
}

export interface RequestWithContext {
  requestId?: string;
  rawBody?: Buffer;
  user?: AuthenticatedRequestUser;
  method: string;
  originalUrl: string;
  url: string;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  get(name: string): string | undefined;
}
