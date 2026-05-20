import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  Handshake,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { serviceBlocks } from "@/lib/mock-data";

const highlights = [
  {
    title: "Candidatos",
    description: "Registro, login, postulaciones y documentos en un solo flujo.",
    icon: FileText,
  },
  {
    title: "Empresas",
    description: "Gestion de vacantes, reclutadores y control de planes.",
    icon: Building2,
  },
  {
    title: "Administracion",
    description: "Gobierno de roles, metricas y supervision del marketplace.",
    icon: ShieldCheck,
  },
];

const goals = [
  "Impulsar la empleabilidad con procesos claros, cercanos y medibles.",
  "Conectar empresas con talento validado en menos tiempo.",
  "Digitalizar reclutamiento, postulacion y gestion documental desde un solo lugar.",
];

const advantages = [
  {
    title: "Acompanamiento humano",
    description: "La plataforma combina autoservicio digital con orientacion y soporte cercano.",
    icon: Handshake,
  },
  {
    title: "Control de cumplimiento",
    description: "Documentos, roles y vacantes quedan centralizados para auditoria y seguimiento.",
    icon: ShieldCheck,
  },
  {
    title: "Velocidad operativa",
    description: "Empresas publican, filtran y avanzan sobre candidatos sin friccion innecesaria.",
    icon: BadgeCheck,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="grid gap-8 rounded-[2rem] border border-border/70 bg-card/90 p-8 text-card-foreground shadow-sm lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Badge variant="secondary" className="w-fit">Plataforma de empleo y talento humano</Badge>
          <div className="space-y-4">
            <h2 className="max-w-2xl font-[family-name:var(--font-merriweather)] text-4xl leading-tight text-foreground lg:text-5xl">
              AIDLABORAL S.A.S. conecta empresas con talento listo para avanzar.
            </h2>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Encuentra vacantes, publica oportunidades y centraliza reclutamiento, documentos y seguimiento
              en una sola experiencia.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/registro">
                Registrarse
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Iniciar sesion</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/empresas">Publicar vacante</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {highlights.map(({ title, description, icon: Icon }) => {
            const isCandidateCard = title === "Candidatos";
            const isCompanyCard = title === "Empresas";
            const isAdminCard = title === "Administracion";
            const cardContent = (
              <Card className="border-border/70 bg-gradient-to-br from-card via-card to-secondary/35 text-card-foreground">
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );

            if (isCandidateCard) {
              return (
                <Link
                  key={title}
                  href="/registro"
                  className="block rounded-[1.5rem] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {cardContent}
                </Link>
              );
            }

            if (isAdminCard) {
              return (
                <Link
                  key={title}
                  href="/login"
                  className="block rounded-[1.5rem] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {cardContent}
                </Link>
              );
            }

            if (isCompanyCard) {
              return (
                <Link
                  key={title}
                  href="/empresas"
                  className="block rounded-[1.5rem] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {cardContent}
                </Link>
              );
            }

            return <div key={title}>{cardContent}</div>;
          })}
        </div>
      </section>

      <section id="quienes-somos" className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/70 bg-card/90 text-card-foreground">
          <CardHeader>
            <CardTitle>Quienes somos</CardTitle>
            <CardDescription>
              AIDLABORAL S.A.S es una plataforma de talento humano enfocada en conectar personas y empleadores
              con procesos mas claros, trazables y eficientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            Integramos reclutamiento, publicacion de vacantes, documentos y seguimiento de postulaciones para
            reducir tiempos de respuesta y mejorar la experiencia de candidatos, reclutadores y equipos
            administrativos.
          </CardContent>
        </Card>

        <Card
          id="objetivos"
          className="border-border/70 bg-gradient-to-br from-card via-card to-accent/15 text-card-foreground"
        >
          <CardHeader>
            <CardTitle>Objetivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal}
                className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground"
              >
                {goal}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <Card id="ciudadania" className="border-border/70 bg-card/90 text-card-foreground">
          <CardHeader>
            <CardTitle>Servicios a la ciudadania</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceBlocks.citizen.map((item) => (
              <div key={item} className="rounded-2xl border border-border/70 p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card id="empleadores" className="border-border/70 bg-card/90 text-card-foreground">
          <CardHeader>
            <CardTitle>Servicios para empleadores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceBlocks.employers.map((item) => (
              <div key={item} className="rounded-2xl border border-border/70 p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="ventajas" className="mt-12">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Ventajas</p>
          <h3 className="text-3xl font-semibold">Ventajas de trabajar con AIDLABORAL S.A.S</h3>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {advantages.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-border/70 bg-card/90 text-card-foreground">
              <CardHeader>
                <div className="mb-3 w-fit rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="size-6" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="contacto" className="mt-12">
        <Card className="border-border/70 bg-gradient-to-br from-card via-card to-accent/20 text-card-foreground">
          <CardHeader>
            <CardTitle>Contactanos</CardTitle>
            <CardDescription>
              Estamos listos para apoyar procesos de seleccion, publicacion de vacantes y crecimiento laboral.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
              <p className="font-medium">Correo</p>
              <p className="text-muted-foreground">contacto@aidlaboral.com</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
              <p className="font-medium">Telefono</p>
              <p className="text-muted-foreground">+593 99 000 0000</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm">
              <p className="font-medium">Atencion</p>
              <p className="text-muted-foreground">Lunes a viernes de 08:00 a 17:00</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
