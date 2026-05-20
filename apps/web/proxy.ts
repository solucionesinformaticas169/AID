import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

const protectedRouteMap: Array<{ prefix: string; allowedRoles: string[] }> = [
  { prefix: "/candidato", allowedRoles: ["CANDIDATE"] },
  { prefix: "/empresa", allowedRoles: ["COMPANY_ADMIN", "RECRUITER"] },
  { prefix: "/admin", allowedRoles: ["SYSTEM_ADMIN"] },
];

function getJwtSecret() {
  return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? "access-secret");
}

export async function proxy(request: NextRequest) {
  const match = protectedRouteMap.find((item) => request.nextUrl.pathname.startsWith(item.prefix));

  if (!match) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = String(payload.role ?? "");

    if (!match.allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-aid-route-scope", "private");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/candidato/:path*", "/empresa/:path*", "/admin/:path*"],
};
