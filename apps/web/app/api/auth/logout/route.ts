import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { backendJsonRequest } from "@/lib/server/backend";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  try {
    if (accessToken && refreshToken) {
      await backendJsonRequest("/auth/logout", {
        method: "POST",
        accessToken,
        body: { refreshToken },
      });
    }
  } catch {
    // Incluso si el backend ya no acepta la sesion, limpiamos cookies locales.
  }

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);

  return NextResponse.json({
    message: "Sesion cerrada correctamente.",
  });
}
