import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "aid_access_token";

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

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/candidato/:path*", "/empresa/:path*", "/admin/:path*"],
};
