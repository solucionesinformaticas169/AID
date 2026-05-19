import { jwtVerify } from "jose";
import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "./constants";

export type SessionUser = {
  sub: string;
  email: string;
  role: string;
  companyId?: string | null;
};

function getJwtSecret() {
  return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? "access-secret");
}

export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    return {
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      role: String(payload.role ?? ""),
      companyId: payload.companyId ? String(payload.companyId) : null,
    };
  } catch {
    return null;
  }
}

export function getDefaultDemoSession(role: "CANDIDATE" | "COMPANY_ADMIN" | "SYSTEM_ADMIN"): SessionUser {
  return {
    sub: "demo-user",
    email: `demo-${role.toLowerCase()}@aidlaboral.com`,
    role,
    companyId: process.env.NEXT_PUBLIC_DEMO_COMPANY_ID ?? null,
  };
}
