"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as {
        message?: string;
        user?: {
          role: string;
        };
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.message ?? "No se pudo iniciar sesion.");
      }

      const destinationMap: Record<string, string> = {
        CANDIDATE: "/candidato",
        COMPANY_ADMIN: "/empresa",
        RECRUITER: "/empresa",
        SYSTEM_ADMIN: "/admin",
      };

      router.push(destinationMap[payload.user.role] ?? "/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-xl px-6 py-14">
      <Card className="w-full border-border/70 bg-white/90">
        <CardHeader>
          <CardTitle>Ingreso a la plataforma</CardTitle>
          <p className="text-sm text-muted-foreground">
            Autenticacion conectada al backend con JWT y cookies seguras.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Iniciando..." : "Iniciar sesion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
