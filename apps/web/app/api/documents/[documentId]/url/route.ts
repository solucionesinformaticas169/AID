import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendJsonRequest } from "@/lib/server/backend";

export async function GET(
  request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  const { documentId } = await context.params;
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "true";

  try {
    const payload = await backendJsonRequest(`/uploads/documents/${documentId}/url?download=${download}`, {
      accessToken,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo generar la URL firmada." },
      { status: 400 },
    );
  }
}
