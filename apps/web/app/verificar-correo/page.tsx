"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando tu correo...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("El enlace de verificacion no contiene un token valido.");
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const payload = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(payload.message ?? "No se pudo verificar el correo.");
        }

        setStatus("success");
        setMessage(payload.message ?? "Correo verificado correctamente.");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "No se pudo verificar el correo.");
      }
    })();
  }, [token]);

  return (
    <main className="mx-auto flex max-w-xl px-6 py-14">
      <Card className="w-full border-border/70 bg-white/90">
        <CardHeader>
          <CardTitle>Verificacion de correo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/login">{status === "success" ? "Ir a iniciar sesion" : "Volver al login"}</Link>
            </Button>
            {status === "error" ? (
              <Button asChild variant="outline">
                <Link href="/recuperar-clave">Necesito ayuda</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
