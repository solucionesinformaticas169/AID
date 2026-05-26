import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendJsonRequest } from "@/lib/server/backend";

type RouteContext = {
  params: Promise<{
    companyId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  const { companyId } = await context.params;

  try {
    const payload = await backendJsonRequest(`/jobs/company/${companyId}`, {
      accessToken,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las vacantes de la empresa.",
      },
      { status: 400 },
    );
  }
}
