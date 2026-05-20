import { NextResponse } from "next/server";

import { backendJsonRequest } from "@/lib/server/backend";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email: string };
    const response = await backendJsonRequest<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: payload,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "No se pudo reenviar la verificacion.",
      },
      { status: 400 },
    );
  }
}
