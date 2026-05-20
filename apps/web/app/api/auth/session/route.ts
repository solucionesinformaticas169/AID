import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { message: "Sesion no valida." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, private",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  return NextResponse.json(
    { authenticated: true, user: session },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, private",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}

