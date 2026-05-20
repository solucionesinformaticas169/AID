import { NextResponse } from "next/server";

import { backendJsonRequest } from "@/lib/server/backend";

export async function GET() {
  try {
    const payload = await backendJsonRequest("/jobs/public");
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "No se pudieron cargar las ofertas publicas.",
      },
      { status: 400 },
    );
  }
}
