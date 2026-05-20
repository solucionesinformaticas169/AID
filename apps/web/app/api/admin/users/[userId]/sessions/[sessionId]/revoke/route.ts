import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendJsonRequest } from "@/lib/server/backend";

type RouteContext = {
  params: Promise<{
    userId: string;
    sessionId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  const { userId, sessionId } = await context.params;

  try {
    const payload = await backendJsonRequest(`/admin/users/${userId}/sessions/${sessionId}/revoke`, {
      method: "PATCH",
      accessToken,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo revocar la sesion." },
      { status: 400 },
    );
  }
}
