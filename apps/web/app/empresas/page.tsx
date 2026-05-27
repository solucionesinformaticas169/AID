import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Check, KeyRound, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { backendJsonRequest } from "@/lib/server/backend";

type PublicPlan = {
  id: string;
  code: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
  name: string;
  description: string | null;
  price: string | number;
  currency: string;
  durationMonths: number;
  jobPostLimit: number | null;
  priorityPublication: boolean;
  advancedMetrics: boolean;
  featuredCandidates: boolean;
  includesFreePosts: boolean;
  freeJobPostsIncluded: number;
  isActive: boolean;
};

function formatCurrency(value: string | number, currency: string) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return `${value} ${currency}`;
  }

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function getPlanHighlights(plan: PublicPlan) {
  return [
    plan.jobPostLimit === null ? "Vacantes ilimitadas" : `${plan.jobPostLimit} vacantes activas`,
    plan.priorityPublication ? "Prioridad en publicacion" : "Publicacion estandar",
    plan.advancedMetrics ? "Metricas empresariales avanzadas" : "Metricas operativas basicas",
    plan.featuredCandidates ? "Candidatos destacados" : "Flujo ATS esencial",
  ];
}

async function getPublicPlans() {
  try {
    const plans = await backendJsonRequest<PublicPlan[]>("/plans");
    return plans.filter((plan) => plan.isActive);
  } catch {
    return [];
  }
}

export default async function CompaniesAccessPage() {
  const plans = await getPublicPlans();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
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

          <Card className="border-border/70 bg-gradient-to-br from-card via-card to-secondary/20">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    Planes empresariales
                  </CardTitle>
                  <CardDescription>
                    Compara capacidades y elige el nivel SaaS ideal para tu operacion de reclutamiento.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  AIDLABORAL SaaS
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/50 p-6 text-sm text-muted-foreground">
                  El catalogo de planes aun no esta disponible. Puedes continuar con el acceso o registro empresarial.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  {plans.map((plan) => {
                    const highlights = getPlanHighlights(plan);
                    const isFeatured = plan.code === "PROFESSIONAL";

                    return (
                      <div
                        key={plan.id}
                        className={`rounded-[1.5rem] border p-5 shadow-sm transition ${
                          isFeatured
                            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/70 bg-background/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold">{plan.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {plan.description ?? "Plan empresarial para gestion de vacantes y postulantes."}
                            </p>
                          </div>
                          {isFeatured ? (
                            <Badge className="shrink-0">Recomendado</Badge>
                          ) : (
                            <Star className="mt-1 size-4 shrink-0 text-primary" />
                          )}
                        </div>

                        <div className="mt-5">
                          <p className="text-3xl font-semibold">
                            {formatCurrency(plan.price, plan.currency)}
                            {plan.durationMonths > 0 ? (
                              <span className="text-base font-normal text-muted-foreground">
                                {" "}
                                / {plan.durationMonths} mes
                              </span>
                            ) : null}
                          </p>
                          {plan.includesFreePosts ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Incluye {plan.freeJobPostsIncluded} publicaciones gratuitas para iniciar.
                            </p>
                          ) : null}
                        </div>

                        <div className="mt-5 space-y-3">
                          {highlights.map((highlight) => (
                            <div key={highlight} className="flex items-start gap-3 text-sm">
                              <span className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                                <Check className="size-3" />
                              </span>
                              <span className="text-foreground/90">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
