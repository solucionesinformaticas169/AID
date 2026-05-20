import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, KeyRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompaniesAccessPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Badge variant="secondary" className="w-fit self-center">
            Acceso empresarial
          </Badge>
          <div className="flex justify-start">
            <Button asChild variant="ghost">
              <Link href="/">
                <ArrowLeft className="mr-2 size-4" />
                Volver al home
              </Link>
            </Button>
          </div>
          <Card className="border-border/70 bg-gradient-to-br from-card via-card to-secondary/35">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <KeyRound className="size-6" />
              </div>
              <div>
                <CardTitle>Ingreso empresarial</CardTitle>
                <CardDescription>
                  Accede con tu cuenta existente para gestionar vacantes, postulantes y plan.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">
                  Ingresar
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-gradient-to-br from-card via-card to-accent/15">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Building2 className="size-6" />
              </div>
              <div>
                <CardTitle>Registro empresarial</CardTitle>
                <CardDescription>
                  Crea la cuenta principal de tu empresa para iniciar el proceso comercial.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/empresas/registro">
                  Crear cuenta de empresa
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
