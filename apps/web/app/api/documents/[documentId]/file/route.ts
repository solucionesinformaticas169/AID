import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendRawRequest } from "@/lib/server/backend";

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
    const response = await backendRawRequest(
      `/uploads/documents/${documentId}/file?download=${download}`,
      {
        accessToken,
      },
    );

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": response.headers.get("content-disposition") ?? "inline",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo abrir el documento." },
      { status: 400 },
    );
  }
}
