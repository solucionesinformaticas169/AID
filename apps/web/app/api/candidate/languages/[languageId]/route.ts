import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendJsonRequest } from "@/lib/server/backend";

type RouteContext = {
  params: Promise<{
    languageId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  try {
    const { languageId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = await backendJsonRequest(`/candidate/languages/${languageId}`, {
      method: "PATCH",
      accessToken,
      body,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo actualizar el idioma." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  try {
    const { languageId } = await context.params;
    const payload = await backendJsonRequest(`/candidate/languages/${languageId}`, {
      method: "DELETE",
      accessToken,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo eliminar el idioma." },
      { status: 400 },
    );
  }
}
