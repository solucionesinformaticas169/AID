"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, MapPin, X } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicJobs, type PublicJob } from "@/lib/api/jobs";

const publicJobsPageSize = 10;

function formatDate(value?: string | null) {
  if (!value) {
    return "Disponible ahora";
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function PublicJobsShowcase() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeJob, setActiveJob] = useState<PublicJob | null>(null);
  const [detailJob, setDetailJob] = useState<PublicJob | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const payload = await getPublicJobs();
        if (isMounted) {
          setJobs(payload);
          setError(null);
        }
      } catch (fetchError) {
        if (isMounted) {
          setJobs([]);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "No se pudieron cargar las vacantes publicas.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredJobs = useMemo(() => {
    if (!normalizedSearch) {
      return jobs;
    }

    return jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.company.name,
        job.city,
        job.country,
        job.description,
        job.requirements,
        job.responsibilities,
        job.benefits,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [jobs, normalizedSearch]);

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / publicJobsPageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedJobs = useMemo(
    () =>
      filteredJobs.slice(
        (currentPage - 1) * publicJobsPageSize,
        currentPage * publicJobsPageSize,
      ),
    [currentPage, filteredJobs],
  );

  if (isLoading) {
    return null;
  }

  const detailSections = detailJob
    ? [
        {
          title: "Descripcion",
          content: detailJob.description,
        },
        {
          title: "Requisitos",
          content: detailJob.requirements,
        },
        {
          title: "Responsabilidades",
          content: detailJob.responsibilities,
        },
        {
          title: "Beneficios",
          content: detailJob.benefits,
        },
      ].filter((section) => section.content && section.content.trim().length > 0)
    : [];

  return (
    <>
      <section className="mt-8 rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-[0_14px_32px_rgba(33,29,8,0.05)]">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Vacantes destacadas
            </p>
            <h3 className="text-2xl font-semibold text-foreground">
              Oportunidades activas para postular
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredJobs.length} vacantes publicadas actualmente
          </p>
        </div>

        <div className="mb-5">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por cargo, empresa, ciudad o palabra clave"
            className="h-12 rounded-2xl border-border/70 bg-background/70 px-4 text-sm shadow-[0_8px_22px_rgba(33,29,8,0.03)]"
          />
        </div>

        {error ? (
          <EmptyState
            title="No se pudieron cargar las vacantes"
            description={error}
            icon={<BriefcaseBusiness className="size-6" />}
          />
        ) : paginatedJobs.length === 0 ? (
          <EmptyState
            title={normalizedSearch ? "Sin resultados para tu busqueda" : "Sin vacantes publicadas"}
            description={
              normalizedSearch
                ? "Prueba con otro cargo, empresa o palabra clave para encontrar oportunidades."
                : "Todavia no existen oportunidades activas en el portal."
            }
            icon={<BriefcaseBusiness className="size-6" />}
          />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {paginatedJobs.map((job) => (
                <Card
                  key={job.id}
                  className="rounded-[1.35rem] border-border/70 bg-background/70 shadow-[0_10px_24px_rgba(33,29,8,0.04)]"
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{job.company.name}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="size-4" />
                        {[job.city, job.country].filter(Boolean).join(", ") || "Ecuador"}
                      </span>
                      <span>Publicada: {formatDate(job.publishedAt ?? job.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setDetailJob(job)}
                        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Ver detalle
                      </button>
                      <Button onClick={() => setActiveJob(job)}>
                        Postular
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredJobs.length > publicJobsPageSize ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredJobs.length} registros - pagina {currentPage} de {totalPages}
                </p>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={currentPage === 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {activeJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/35 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={() => setActiveJob(null)}
          />
          <Card className="relative z-10 w-full max-w-xl rounded-[1.75rem] border-border/70 bg-card shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Postular a vacante
                </p>
                <CardTitle className="text-2xl">{activeJob.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Para continuar con la postulacion, ingresa con tu cuenta o registrate como candidato.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => setActiveJob(null)}>
                <X className="size-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{activeJob.company.name}</p>
                <p>{[activeJob.city, activeJob.country].filter(Boolean).join(", ") || "Ecuador"}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href="/login">Iniciar sesion</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/registro">Registrate</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {detailJob ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/35 px-4 py-6 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={() => setDetailJob(null)}
          />
          <div className="relative z-10 flex min-h-full items-center justify-center">
            <Card className="my-auto flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border-border/70 bg-card shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
            <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4 space-y-0 border-b border-border/60 bg-card">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Detalle de vacante
                </p>
                <CardTitle className="text-2xl">{detailJob.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {detailJob.company.name} · {[detailJob.city, detailJob.country].filter(Boolean).join(", ") || "Ecuador"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => setDetailJob(null)}
              >
                <X className="size-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 overflow-y-auto p-6">
              <div className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Publicada
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {formatDate(detailJob.publishedAt ?? detailJob.createdAt)}
                  </p>
                </div>
                {detailJob.closesAt ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Cierre
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {formatDate(detailJob.closesAt)}
                    </p>
                  </div>
                ) : null}
                {detailJob.requiredEducationLevel ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Formacion
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {detailJob.requiredEducationLevel}
                    </p>
                  </div>
                ) : null}
                {typeof detailJob.minimumYearsExperience === "number" &&
                detailJob.minimumYearsExperience > 0 ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Experiencia
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {detailJob.minimumYearsExperience}{" "}
                      {detailJob.minimumYearsExperience === 1 ? "ano" : "anos"}
                    </p>
                  </div>
                ) : null}
                {detailJob.salaryMin || detailJob.salaryMax ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Rango salarial
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {detailJob.salaryMin ? `$${detailJob.salaryMin}` : "Desde definir"}{" "}
                      {detailJob.salaryMax ? `- $${detailJob.salaryMax}` : ""}
                    </p>
                  </div>
                ) : null}
                {detailJob.requiredLanguages?.length ? (
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Idiomas
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {detailJob.requiredLanguages.join(", ")}
                    </p>
                  </div>
                ) : null}
              </div>

              {detailSections.length ? (
                <div className="grid gap-4">
                  {detailSections.map((section) => (
                    <div
                      key={section.title}
                      className="rounded-[1.1rem] border border-border/70 bg-background/55 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {section.title}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm text-foreground/85">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                Para continuar con la postulacion, inicia sesion con tu cuenta o registrate como candidato.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href="/login">Iniciar sesion</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/registro">Registrate</Link>
                </Button>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
