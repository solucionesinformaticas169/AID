import { NextResponse } from "next/server";

import { backendJsonRequest } from "@/lib/server/backend";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email: string };
    const response = await backendJsonRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: payload,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "No se pudo iniciar la recuperacion.",
      },
      { status: 400 },
    );
  }
}
