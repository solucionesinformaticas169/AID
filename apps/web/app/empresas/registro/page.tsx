"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CompanyRegisterPage() {
  const [form, setForm] = useState({
    companyName: "",
    commercialName: "",
    taxId: "",
    city: "",
    country: "Ecuador",
    address: "",
    website: "",
    industry: "",
    firstName: "",
    lastName: "",
    contactPosition: "",
    email: "",
    billingEmail: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const requestPayload = Object.fromEntries(
        Object.entries({
          ...form,
          roleCode: "COMPANY_ADMIN",
        }).filter(([, value]) => value !== ""),
      );

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });
      const payload = (await response.json()) as { message?: string; user?: { role: string } };

      if (!response.ok || !payload.user) {
        throw new Error(payload.message ?? "No se pudo crear la cuenta empresarial.");
      }

      setSuccess("Empresa registrada. Ya puedes iniciar sesion.");
      window.setTimeout(() => {
        window.location.assign("/login");
      }, 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear la cuenta empresarial.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-semibold">Registro empresarial</h2>
        <p className="text-muted-foreground">
          Registra la cuenta principal y los datos base de tu empresa para iniciar el proceso de aprobacion.
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        <Card className="border-border/70 bg-card/90 text-card-foreground">
          <CardHeader>
            <CardTitle>Crear cuenta de empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <Input
                  placeholder="Razon social"
                  value={form.companyName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, companyName: event.target.value }))
                  }
                  required
                />
              </div>
              <Input
                placeholder="Nombre comercial (opcional)"
                value={form.commercialName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, commercialName: event.target.value }))
                }
              />
              <Input
                placeholder="RUC"
                value={form.taxId}
                onChange={(event) => setForm((current) => ({ ...current, taxId: event.target.value }))}
                required
              />
              <Input
                placeholder="Ciudad"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                required
              />
              <Input
                placeholder="Pais"
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({ ...current, country: event.target.value }))
                }
                required
              />
              <div className="md:col-span-2">
                <Input
                  placeholder="Direccion"
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </div>
              <Input
                placeholder="Sitio web (opcional)"
                value={form.website}
                onChange={(event) =>
                  setForm((current) => ({ ...current, website: event.target.value }))
                }
              />
              <Input
                placeholder="Industria o sector"
                value={form.industry}
                onChange={(event) =>
                  setForm((current) => ({ ...current, industry: event.target.value }))
                }
              />
              <Input
                placeholder="Nombres del responsable"
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                required
              />
              <Input
                placeholder="Apellidos del responsable"
                value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                required
              />
              <Input
                placeholder="Cargo del responsable"
                value={form.contactPosition}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactPosition: event.target.value }))
                }
                required
              />
              <Input
                type="email"
                placeholder="Correo empresarial"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
              <Input
                type="email"
                placeholder="Correo de facturacion (opcional)"
                value={form.billingEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, billingEmail: event.target.value }))
                }
              />
              <Input
                placeholder="Telefono de contacto"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
              <div className="md:col-span-2">
                <Input
                  type="password"
                  placeholder="Contrasena"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              {success ? <p className="text-sm text-emerald-600 md:col-span-2">{success}</p> : null}
              {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registrando..." : "Registrar empresa"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/empresas">Volver</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
