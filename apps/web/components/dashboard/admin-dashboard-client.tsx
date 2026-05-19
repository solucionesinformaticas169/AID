"use client";

import { useState } from "react";
import { Building2, Shield, Users2, Workflow } from "lucide-react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardTable } from "@/components/dashboard/dashboard-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminStats } from "@/lib/mock-data";

const pendingCompanies = [
  { name: "TechNova S.A.", status: "Pendiente", region: "Quito" },
  { name: "Grupo Andino", status: "Pendiente", region: "Guayaquil" },
  { name: "Servicios Integrales EC", status: "Pendiente", region: "Cuenca" },
];

const moderatedJobs = [
  { name: "Desarrollador Backend", reason: "Revision de contenido" },
  { name: "Asistente Contable", reason: "Validacion salarial" },
  { name: "Jefe de Operaciones", reason: "Control de requisitos" },
];

export function AdminDashboardClient() {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, openModal } = useFeedback();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={adminStats[0].label} value={adminStats[0].value} helper="Ecosistema empresarial" icon={<Building2 className="size-5" />} />
        <StatCard label={adminStats[1].label} value={adminStats[1].value} helper="Monetizacion recurrente" icon={<Workflow className="size-5" />} />
        <StatCard label={adminStats[2].label} value={adminStats[2].value} helper="Crecimiento anualizado" icon={<Shield className="size-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Aprobacion de empresas</CardTitle>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoading(true);
                window.setTimeout(() => {
                  setIsLoading(false);
                  showToast({ title: "Bandeja actualizada", description: "Las solicitudes pendientes fueron refrescadas." });
                }, 800);
              }}
            >
              Refrescar
            </Button>
          </CardHeader>
          <CardContent>
            <DashboardTable
              columns={[
                {
                  key: "name",
                  label: "Empresa",
                  render: (row) => (
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-sm text-muted-foreground">{row.region}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Estado",
                  render: (row) => <Badge variant="secondary">{row.status}</Badge>,
                },
                {
                  key: "action",
                  label: "Accion",
                  render: (row) => (
                    <Button
                      size="sm"
                      onClick={() =>
                        openModal({
                          title: `Aprobar ${row.name}`,
                          description: "Confirmacion centralizada con sistema modal.",
                          content: (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">Valida documentos comerciales, informacion legal y origen de publicaciones antes de aprobar.</p>
                              <Button onClick={() => showToast({ title: "Empresa aprobada", description: `${row.name} paso a estado aprobado.` })}>Confirmar</Button>
                            </div>
                          ),
                        })
                      }
                    >
                      Aprobar
                    </Button>
                  ),
                },
              ]}
              rows={pendingCompanies}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Moderacion de vacantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {moderatedJobs.map((job) => (
                <div key={job.name} className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                  <div>
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-muted-foreground">{job.reason}</p>
                  </div>
                  <Button variant="ghost" size="sm">Revisar</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Gestion de usuarios</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {["Candidatos", "Reclutadores", "Administradores"].map((group) => (
                <div key={group} className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border/70 bg-card p-2 text-primary">
                      <Users2 className="size-4" />
                    </div>
                    <span className="font-medium">{group}</span>
                  </div>
                  <Button variant="outline" size="sm">Gestionar</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
