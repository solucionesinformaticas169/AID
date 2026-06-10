import { NextResponse } from "next/server";

import { backendRawRequest } from "@/lib/server/backend";

export async function GET(
  _request: Request,
  context: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await context.params;

  try {
    const response = await backendRawRequest(`/companies/public/${companyId}/logo`);
    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": response.headers.get("cache-control") ?? "public, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo cargar el logo." },
      { status: 404 },
    );
  }
}
