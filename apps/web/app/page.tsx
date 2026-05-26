import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  Handshake,
  ShieldCheck,
} from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <section className="grid gap-8 rounded-[2rem] border border-border/70 bg-card/90 p-8 text-card-foreground shadow-[0_20px_56px_rgba(33,29,8,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <BrandLogo />
          <Badge variant="secondary" className="w-fit border-primary/20 bg-primary/15 text-foreground">
            Plataforma de empleo y talento humano
          </Badge>
          <div className="space-y-4">
            <h2 className="max-w-2xl text-4xl font-semibold leading-tight text-foreground lg:text-5xl">
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
          <Card className="border-primary/20 bg-[linear-gradient(135deg,rgba(255,215,0,0.18),rgba(255,255,255,0.96))] shadow-[0_18px_40px_rgba(255,215,0,0.18)]">
            <CardContent className="flex items-center justify-between gap-6 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Identidad corporativa</p>
                <h3 className="text-2xl font-semibold text-foreground">Presencia premium y cercana</h3>
                <p className="text-sm text-muted-foreground">
                  Una interfaz pensada para transmitir confianza, claridad operativa y valor empresarial.
                </p>
              </div>
              <div className="hidden overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-sm sm:block">
                <Image
                  src="/logo-aidlaboral.jpeg"
                  alt="Logo AIDLABORAL S.A.S."
                  width={144}
                  height={144}
                  className="h-36 w-36 object-cover"
                />
              </div>
            </CardContent>
          </Card>
          {highlights.map(({ title, description, icon: Icon }) => {
            const isCandidateCard = title === "Candidatos";
            const isCompanyCard = title === "Empresas";
            const isAdminCard = title === "Administracion";
            const cardContent = (
              <Card className="border-border/70 bg-gradient-to-br from-card via-card to-secondary/65 text-card-foreground shadow-[0_12px_30px_rgba(33,29,8,0.05)]">
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                  <div className="rounded-2xl bg-primary/15 p-3 text-foreground">
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
        <Card className="border-border/70 bg-card/90 text-card-foreground shadow-[0_16px_36px_rgba(33,29,8,0.05)]">
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
          className="border-border/70 bg-gradient-to-br from-card via-card to-accent/30 text-card-foreground shadow-[0_16px_36px_rgba(33,29,8,0.05)]"
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
        <Card id="ciudadania" className="border-border/70 bg-card/90 text-card-foreground shadow-[0_16px_36px_rgba(33,29,8,0.05)]">
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

        <Card id="empleadores" className="border-border/70 bg-card/90 text-card-foreground shadow-[0_16px_36px_rgba(33,29,8,0.05)]">
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
            <Card key={title} className="border-border/70 bg-card/90 text-card-foreground shadow-[0_16px_36px_rgba(33,29,8,0.05)]">
              <CardHeader>
                <div className="mb-3 w-fit rounded-2xl bg-primary/15 p-3 text-foreground">
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
        <Card className="border-border/70 bg-gradient-to-br from-card via-card to-accent/35 text-card-foreground shadow-[0_18px_40px_rgba(33,29,8,0.06)]">
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
