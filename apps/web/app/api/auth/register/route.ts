import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, AUTH_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendJsonRequest } from "@/lib/server/backend";

type AuthResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    companyId?: string | null;
  };
  accessToken: string;
  refreshToken: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roleCode?: string;
    };
    const response = await backendJsonRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
    const cookieStore = await cookies();

    cookieStore.set(ACCESS_TOKEN_COOKIE, response.accessToken, AUTH_COOKIE_OPTIONS);
    cookieStore.set(REFRESH_TOKEN_COOKIE, response.refreshToken, AUTH_COOKIE_OPTIONS);

    return NextResponse.json({
      message: response.message,
      user: response.user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "No se pudo registrar el usuario.",
      },
      { status: 400 },
    );
  }
}
