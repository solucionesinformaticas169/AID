import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendJsonRequest } from "@/lib/server/backend";

type RouteContext = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  const { applicationId } = await context.params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = await backendJsonRequest(`/applications/${applicationId}/status`, {
      method: "PATCH",
      accessToken,
      body,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado de la postulacion.",
      },
      { status: 400 },
    );
  }
}
