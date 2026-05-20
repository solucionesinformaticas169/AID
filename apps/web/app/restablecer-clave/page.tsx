"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo restablecer la contrasena.");
      }

      setMessage(payload.message ?? "Contrasena actualizada correctamente.");
      setNewPassword("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "No se pudo restablecer la contrasena.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-xl px-6 py-14">
      <Card className="w-full border-border/70 bg-white/90">
        <CardHeader>
          <CardTitle>Restablecer contrasena</CardTitle>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Este enlace no contiene un token valido de recuperacion.
              </p>
              <Button asChild>
                <Link href="/recuperar-clave">Solicitar nuevo enlace</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                type="password"
                placeholder="Nueva contrasena"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={6}
              />
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Actualizando..." : "Guardar contrasena"}
              </Button>
              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
