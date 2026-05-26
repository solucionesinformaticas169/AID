import { NextResponse } from "next/server";

import { backendJsonRequest } from "@/lib/server/backend";

export async function GET() {
  try {
    const payload = await backendJsonRequest("/plans");
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "No se pudieron cargar los planes.",
      },
      { status: 400 },
    );
  }
}
