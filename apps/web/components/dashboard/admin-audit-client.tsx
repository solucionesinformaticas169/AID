"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, Shield } from "lucide-react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardTable } from "@/components/dashboard/dashboard-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterPillGroup } from "@/components/dashboard/filter-pill-group";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SessionUser } from "@/lib/auth/session";
import { getAuditLogs, type AuditLogRecord } from "@/lib/api/admin";

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function isSuperAdmin(user: SessionUser | null) {
  return user?.email?.toLowerCase() === "superadmin@aidlaboral.com";
}

export function AdminAuditClient({ user }: { user: SessionUser | null }) {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const { showToast } = useFeedback();
  const pageSize = 8;

  if (!isSuperAdmin(user)) {
    return (
      <Card className="rounded-[1.75rem] border-border/70 bg-card/90">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <div className="rounded-3xl border border-border/70 bg-background/80 p-4 text-primary">
            <Shield className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Modulo exclusivo de SuperAdmin</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Auditoria operativa, seguridad y configuracion avanzada solo estan disponibles para la cuenta superadmin.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const loadLogs = useCallback(async (options?: { notifyOnError?: boolean }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const filters: Record<string, string> = {};

      if (dateFrom) {
        filters.dateFrom = new Date(dateFrom).toISOString();
      }

      if (dateTo) {
        filters.dateTo = new Date(`${dateTo}T23:59:59`).toISOString();
      }

      if (actionFilter !== "Todos") {
        filters.action = actionFilter;
      }

      const payload = await getAuditLogs(filters);
      setLogs(payload);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Error inesperado.";
      setErrorMessage(nextMessage);

      if (options?.notifyOnError) {
        showToast({
          title: "No se pudieron cargar los logs",
          description: nextMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, dateFrom, dateTo, showToast]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const availableActions = useMemo(() => {
    const actions = Array.from(new Set(logs.map((log) => log.action)));
    return ["Todos", ...actions];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    return logs.filter((log) => {
      if (normalizedSearch.length === 0) {
        return true;
      }

      return [
        log.action,
        log.entityType ?? "",
        log.entityId ?? "",
        log.user?.email ?? "",
        log.user ? `${log.user.firstName} ${log.user.lastName}` : "",
        log.ip ?? "",
      ]
        .map(normalizeText)
        .some((value) => value.includes(normalizedSearch));
    });
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading && logs.length === 0) {
    return <DashboardSkeleton />;
  }

  if (logs.length === 0 && errorMessage) {
    return (
      <Card className="rounded-[1.75rem] border-border/70 bg-card/90">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <div className="rounded-3xl border border-border/70 bg-background/80 p-4 text-primary">
            <Shield className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">No se pudo cargar la auditoria</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          <Button variant="outline" onClick={() => void loadLogs({ notifyOnError: true })}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.75rem] border-border/70 bg-card/90">
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl">Auditoria operacional</CardTitle>
            <p className="text-sm text-muted-foreground">
              Vista conectada a <code>GET /api/admin/audit-logs</code> con filtros por accion, fecha y busqueda libre.
            </p>
          </div>
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por usuario, accion, entidad o IP"
                className="pl-9"
              />
            </div>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="pl-9" />
            </div>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="pl-9" />
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                setPage(1);
                await loadLogs({ notifyOnError: true });
              }}
            >
              Aplicar filtros
            </Button>
          </div>
          <FilterPillGroup
            items={availableActions}
            activeItem={actionFilter}
            onChange={(value) => {
              setActionFilter(value);
              setPage(1);
            }}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {paginatedLogs.length === 0 ? (
            <EmptyState
              title="No hay eventos para este filtro"
              description="Ajusta las fechas, la accion o la busqueda para encontrar eventos de auditoria."
              icon={<Shield className="size-5" />}
            />
          ) : (
            <DashboardTable
              columns={[
                {
                  key: "action",
                  label: "Accion",
                  render: (row: AuditLogRecord) => <Badge variant="secondary">{row.action}</Badge>,
                },
                {
                  key: "user",
                  label: "Usuario",
                  render: (row: AuditLogRecord) =>
                    row.user ? (
                      <div>
                        <p className="font-medium">{`${row.user.firstName} ${row.user.lastName}`.trim()}</p>
                        <p className="text-sm text-muted-foreground">{row.user.email}</p>
                      </div>
                    ) : (
                      "Sistema"
                    ),
                },
                {
                  key: "entity",
                  label: "Entidad",
                  render: (row: AuditLogRecord) => (
                    <div>
                      <p className="font-medium">{row.entityType ?? "General"}</p>
                      <p className="text-sm text-muted-foreground">{row.entityId ?? "Sin entidad"}</p>
                    </div>
                  ),
                },
                {
                  key: "request",
                  label: "Contexto",
                  render: (row: AuditLogRecord) => (
                    <div>
                      <p className="font-medium">{row.ip ?? "Sin IP"}</p>
                      <p className="text-sm text-muted-foreground">{row.requestId ?? "Sin requestId"}</p>
                    </div>
                  ),
                },
                {
                  key: "createdAt",
                  label: "Fecha",
                  render: (row: AuditLogRecord) => formatDate(row.createdAt),
                },
              ]}
              rows={paginatedLogs}
            />
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {filteredLogs.length} eventos - pagina {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
