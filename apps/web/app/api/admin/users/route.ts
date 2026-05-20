import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendJsonRequest } from "@/lib/server/backend";

export async function GET(request: Request) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roleCode = searchParams.get("roleCode");
  const path = roleCode ? `/admin/users?roleCode=${encodeURIComponent(roleCode)}` : "/admin/users";

  try {
    const payload = await backendJsonRequest(path, {
      accessToken,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudieron cargar los usuarios." },
      { status: 400 },
    );
  }
}
