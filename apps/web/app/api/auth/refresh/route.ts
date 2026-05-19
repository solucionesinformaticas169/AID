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

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No hay refresh token disponible." }, { status: 401 });
  }

  try {
    const response = await backendJsonRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });

    cookieStore.set(ACCESS_TOKEN_COOKIE, response.accessToken, AUTH_COOKIE_OPTIONS);
    cookieStore.set(REFRESH_TOKEN_COOKIE, response.refreshToken, AUTH_COOKIE_OPTIONS);

    return NextResponse.json({
      message: response.message,
      user: response.user,
    });
  } catch (error) {
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "No se pudo renovar la sesion.",
      },
      { status: 401 },
    );
  }
}
