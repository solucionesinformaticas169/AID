"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, FileCheck2, Filter, Search, Sparkles } from "lucide-react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardTable } from "@/components/dashboard/dashboard-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterPillGroup } from "@/components/dashboard/filter-pill-group";
import { StatCard } from "@/components/dashboard/stat-card";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { candidateApplications, candidateStats } from "@/lib/mock-data";

const filters = ["Todas", "Aplicada", "En revision", "Entrevista"];

export function CandidateDashboardClient() {
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, openModal } = useFeedback();

  const filteredApplications = useMemo(
    () =>
      candidateApplications.filter((application) => {
        const matchesFilter =
          activeFilter === "Todas" || application.status.toLowerCase() === activeFilter.toLowerCase();
        const matchesQuery =
          application.vacancyTitle.toLowerCase().includes(query.toLowerCase()) ||
          application.company.toLowerCase().includes(query.toLowerCase());

        return matchesFilter && matchesQuery;
      }),
    [activeFilter, query],
  );

  const statIcons = [<BriefcaseBusiness key="a" className="size-5" />, <Sparkles key="b" className="size-5" />, <FileCheck2 key="c" className="size-5" />];

  const triggerLoading = () => {
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      showToast({
        title: "Panel actualizado",
        description: "La informacion de postulaciones fue recargada correctamente.",
      });
    }, 900);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {candidateStats.map((stat, index) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={index === 0 ? "Seguimiento en tiempo real" : index === 1 ? "Procesos en curso" : "Expediente digital"}
            icon={statIcons[index]}
          />
        ))}
      </div>

      <Card className="rounded-[1.5rem] border-border/60 bg-card/85">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por cargo o empresa" className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterPillGroup items={filters} activeItem={activeFilter} onChange={setActiveFilter} />
            <Button variant="outline" onClick={triggerLoading}>
              <Filter className="mr-2 size-4" />
              Refrescar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Postulaciones activas</CardTitle>
            <Badge variant="secondary">{filteredApplications.length} resultados</Badge>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <EmptyState
                title="No hay postulaciones con ese filtro"
                description="Prueba con otro estado o limpia la busqueda para volver a ver las oportunidades activas."
                icon={<Search className="size-6" />}
                action={<Button onClick={() => { setQuery(""); setActiveFilter("Todas"); }}>Limpiar filtros</Button>}
              />
            ) : (
              <DashboardTable
                columns={[
                  {
                    key: "vacancy",
                    label: "Vacante",
                    render: (row) => (
                      <div>
                        <p className="font-medium">{row.vacancyTitle}</p>
                        <p className="text-sm text-muted-foreground">{row.company}</p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: "Estado",
                    render: (row) => <Badge variant="outline">{row.status}</Badge>,
                  },
                  {
                    key: "compatibility",
                    label: "Compatibilidad",
                    render: (row) => <span className="font-medium">{row.compatibility}%</span>,
                  },
                  {
                    key: "actions",
                    label: "Acciones",
                    render: (row) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openModal({
                            title: row.vacancyTitle,
                            description: `Timeline y compatibilidad para ${row.company}.`,
                            content: (
                              <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  {row.timeline.map((step: string) => (
                                    <Badge key={step} variant="secondary">
                                      {step}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Compatibilidad calculada: {row.compatibility}%. Puedes reforzar tu hoja de vida con certificaciones y experiencia relevante.
                                </p>
                              </div>
                            ),
                          })
                        }
                      >
                        Ver detalle
                      </Button>
                    ),
                  },
                ]}
                rows={filteredApplications}
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Timeline de postulaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidateApplications.slice(0, 3).map((application) => (
              <div key={application.id} className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                <p className="font-medium">{application.vacancyTitle}</p>
                <div className="mt-4 space-y-3">
                  {application.timeline.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="mt-1 flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step}</p>
                        <p className="text-sm text-muted-foreground">Seguimiento ATS inspirado en LinkedIn Jobs y Workday.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
