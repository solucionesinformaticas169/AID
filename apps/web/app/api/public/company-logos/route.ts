import { NextResponse } from "next/server";

import { backendJsonRequest } from "@/lib/server/backend";

export async function GET() {
  try {
    const payload = await backendJsonRequest<
      Array<{
        id: string;
        name: string;
        legalName: string;
        website: string | null;
        city: string | null;
        country: string | null;
      }>
    >("/companies/public/logos");

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudieron cargar los logos empresariales." },
      { status: 400 },
    );
  }
}
