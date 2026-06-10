"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, MapPin, X } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicJobs, type PublicJob } from "@/lib/api/jobs";

const publicJobsPageSize = 8;

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

  const totalPages = Math.max(1, Math.ceil(jobs.length / publicJobsPageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedJobs = useMemo(
    () =>
      jobs.slice(
        (currentPage - 1) * publicJobsPageSize,
        currentPage * publicJobsPageSize,
      ),
    [currentPage, jobs],
  );

  if (isLoading) {
    return null;
  }

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
            {jobs.length} vacantes publicadas actualmente
          </p>
        </div>

        {error ? (
          <EmptyState
            title="No se pudieron cargar las vacantes"
            description={error}
            icon={<BriefcaseBusiness className="size-6" />}
          />
        ) : paginatedJobs.length === 0 ? (
          <EmptyState
            title="Sin vacantes publicadas"
            description="Todavia no existen oportunidades activas en el portal."
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
                      <Link
                        href={`/vacantes/${job.slug}`}
                        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Ver detalle
                      </Link>
                      <Button onClick={() => setActiveJob(job)}>
                        Postular
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {jobs.length > publicJobsPageSize ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {jobs.length} registros - pagina {currentPage} de {totalPages}
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
    </>
  );
}
