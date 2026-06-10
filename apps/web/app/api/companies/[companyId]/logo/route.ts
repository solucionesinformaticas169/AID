import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { buildBackendUrl } from "@/lib/server/backend";

export async function POST(
  request: Request,
  context: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await context.params;
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  try {
    const incomingFormData = await request.formData();
    const backendFormData = new FormData();

    for (const [key, value] of incomingFormData.entries()) {
      backendFormData.append(key, value);
    }

    const response = await fetch(buildBackendUrl(`/companies/${companyId}/logo`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: backendFormData,
      cache: "no-store",
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo subir el logo." },
      { status: 400 },
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await context.params;
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sesion requerida." }, { status: 401 });
  }

  try {
    const response = await fetch(buildBackendUrl(`/companies/${companyId}/logo`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = await response.json();
      return NextResponse.json(payload, { status: response.status });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": response.headers.get("cache-control") ?? "private, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo cargar el logo de la empresa." },
      { status: 400 },
    );
  }
}
