"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  FileCheck2,
  FileText,
  Receipt,
  Search,
  Shield,
  Settings2,
  Users2,
} from "lucide-react";
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
import type { SessionUser } from "@/lib/auth/session";
import {
  getAdminConsole,
  type AdminConsoleApplication,
  type AdminConsoleAuditPreview,
  type AdminConsoleCompany,
  type AdminConsoleDocument,
  type AdminConsoleInvoice,
  type AdminConsoleJob,
  type AdminConsolePayment,
  type AdminConsoleResponse,
  type AdminConsoleUser,
} from "@/lib/api/admin";

function formatDate(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Date(value).toLocaleString();
}

function formatCurrency(value: string, currency: string) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return `${value} ${currency}`;
  }

  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
  }).format(numericValue);
}

function normalizeText(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type ResourceSectionProps<T> = {
  id: string;
  title: string;
  description: string;
  rows: T[];
  filters: string[];
  defaultFilter: string;
  searchPlaceholder: string;
  getFilterValue: (row: T) => string;
  matchesSearch: (row: T, search: string) => boolean;
  columns: Array<{
    key: string;
    label: string;
    render: (row: T) => React.ReactNode;
  }>;
  emptyTitle: string;
  emptyDescription: string;
};

function ResourceSection<T>({
  id,
  title,
  description,
  rows,
  filters,
  defaultFilter,
  searchPlaceholder,
  getFilterValue,
  matchesSearch,
  columns,
  emptyTitle,
  emptyDescription,
}: ResourceSectionProps<T>) {
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filteredRows = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    return rows.filter((row) => {
      const passesFilter = activeFilter === "Todos" || getFilterValue(row) === activeFilter;
      const passesSearch = normalizedSearch.length === 0 || matchesSearch(row, normalizedSearch);
      return passesFilter && passesSearch;
    });
  }, [activeFilter, getFilterValue, matchesSearch, rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Card id={id} className="scroll-mt-24 rounded-[1.75rem] border-border/70 bg-card/90">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
          <FilterPillGroup
            items={filters}
            activeItem={activeFilter}
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {paginatedRows.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon={<Search className="size-5" />}
          />
        ) : (
          <DashboardTable columns={columns} rows={paginatedRows} />
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredRows.length} registros - pagina {currentPage} de {totalPages}
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
      </CardContent>
    </Card>
  );
}

function statusBadge(label: string) {
  return <Badge variant="secondary">{label}</Badge>;
}

function formatOperationalCompanyStatus(status: AdminConsoleCompany["operationalStatus"]) {
  const labels: Record<AdminConsoleCompany["operationalStatus"], string> = {
    ACTIVA: "Activa",
    SIN_CARGAS: "Sin cargas gratuitas",
    PLAN_ACTIVO: "Plan activo",
    RECHAZADA: "Rechazada",
  };

  return labels[status];
}

function formatUserRole(role?: AdminConsoleUser["roleCode"] | null) {
  const labels: Record<NonNullable<AdminConsoleUser["roleCode"]>, string> = {
    CANDIDATE: "Candidato",
    RECRUITER: "Reclutador",
    SYSTEM_ADMIN: "Administrador",
  };

  return role ? labels[role] : "Sin rol";
}

function formatJobStatus(status: AdminConsoleJob["status"]) {
  const labels: Record<AdminConsoleJob["status"], string> = {
    PUBLISHED: "Publicada",
    DRAFT: "Borrador",
    PAUSED: "Pausada",
    CLOSED: "Cerrada",
  };

  return labels[status];
}

function formatApplicationStatus(status: AdminConsoleApplication["status"]) {
  const labels: Record<AdminConsoleApplication["status"], string> = {
    APPLIED: "Enviado",
    REVIEWING: "En revision",
    SHORTLISTED: "Preseleccionado",
    INTERVIEW: "Entrevista",
    REJECTED: "Rechazado",
    HIRED: "Contratado",
  };

  return labels[status];
}

function formatPaymentStatus(status: AdminConsolePayment["status"]) {
  const labels: Record<AdminConsolePayment["status"], string> = {
    PAID: "Pagado",
    PENDING: "Pendiente",
    FAILED: "Fallido",
    REFUNDED: "Reembolsado",
  };

  return labels[status];
}

function formatInvoiceStatus(status: AdminConsoleInvoice["status"]) {
  const labels: Record<AdminConsoleInvoice["status"], string> = {
    PAID: "Pagada",
    ISSUED: "Emitida",
    DRAFT: "Borrador",
    FAILED: "Fallida",
    VOID: "Anulada",
  };

  return labels[status];
}

function formatDocumentType(type: AdminConsoleDocument["type"]) {
  const labels: Record<AdminConsoleDocument["type"], string> = {
    CV: "Hoja de vida",
    ID: "Identificacion",
    CERTIFICATE: "Certificado",
    LICENSE: "Licencia",
    OTHER: "Otro",
  };

  return labels[type];
}

function ConfigurationCard({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{label}</p>
        <Badge variant="secondary">{enabled ? "Activo" : "Pendiente"}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {enabled ? "Configuracion detectada en el entorno actual." : "Todavia requiere variables o activacion final."}
      </p>
    </div>
  );
}

function isSuperAdmin(user: SessionUser | null) {
  return user?.email?.toLowerCase() === "superadmin@aidlaboral.com";
}

export function AdminDashboardClient({ user }: { user: SessionUser | null }) {
  const [data, setData] = useState<AdminConsoleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showToast } = useFeedback();
  const superAdmin = isSuperAdmin(user);

  const scrollToSection = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", `#${sectionId}`);
  }, []);

  const loadConsole = useCallback(async (options?: { notifyOnError?: boolean }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await getAdminConsole();
      setData(payload);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Error inesperado.";
      setErrorMessage(nextMessage);

      if (options?.notifyOnError) {
        showToast({
          title: "No se pudo cargar la consola",
          description: nextMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadConsole();
  }, [loadConsole]);

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <Card className="rounded-[1.75rem] border-border/70 bg-card/90">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <div className="rounded-3xl border border-border/70 bg-background/80 p-4 text-primary">
            <Shield className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">No se pudo cargar la consola</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {errorMessage ?? "Ocurrio un problema al consultar el backend administrativo."}
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadConsole({ notifyOnError: true })}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summaryCards = [
    {
      label: "Usuarios registrados",
      value: String(data.summary.usersRegistered),
      helper: "Base total de cuentas creadas en la plataforma.",
      icon: <Users2 className="size-5" />,
      sectionId: "a-usuarios",
    },
    {
      label: "Empresas registradas",
      value: String(data.summary.companiesRegistered),
      helper: "Empresas creadas y con trazabilidad administrativa.",
      icon: <Building2 className="size-5" />,
      sectionId: "a-empresas",
    },
    {
      label: "Vacantes publicadas",
      value: String(data.summary.jobsPublished),
      helper: "Ofertas visibles o aprobadas para salida a mercado.",
      icon: <BriefcaseBusiness className="size-5" />,
      sectionId: "a-vacantes",
    },
    {
      label: "Postulaciones",
      value: String(data.summary.applicationsCount),
      helper: "Flujo agregado de candidaturas registradas.",
      icon: <FileCheck2 className="size-5" />,
      sectionId: "a-postulaciones",
    },
    {
      label: "Pagos recibidos",
      value: String(data.summary.paymentsReceived),
      helper: "Cobros conciliados y marcados como pagados.",
      icon: <CreditCard className="size-5" />,
      sectionId: "a-pagos",
    },
    {
      label: "Planes activos",
      value: String(data.summary.activePlansCount),
      helper: "Suscripciones vigentes o en periodo de prueba.",
      icon: <Receipt className="size-5" />,
      sectionId: "a-pagos",
    },
    {
      label: "Documentos subidos",
      value: String(data.summary.uploadedDocumentsCount),
      helper: "Archivos de candidatos registrados en storage.",
      icon: <FileText className="size-5" />,
      sectionId: "a-documentos",
    },
  ];

  const securityRows = [
    ...data.security.lockedAttempts.map((item) => ({
      id: `locked-${item.id}`,
      type: "Bloqueo de acceso",
      principal: item.email,
      detail: `${item.failedCount} intentos fallidos - IP ${item.ip}`,
      status: "Alta",
      happenedAt: item.lockedUntil ?? item.lastAttemptAt,
    })),
    ...data.security.reusedSessions.map((item) => ({
      id: `reuse-${item.id}`,
      type: "Reuso de refresh token",
      principal: item.email,
      detail: `${item.ip ?? "IP desconocida"} - ${item.userAgent ?? "Agente no disponible"}`,
      status: "Critica",
      happenedAt: item.reuseDetectedAt ?? "",
    })),
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">Centro operativo</Badge>
            <h2 className="text-3xl font-semibold">Vista ejecutiva de AIDLABORAL</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Consola administrativa con foco en operacion, seguridad, monetizacion y trazabilidad. Cada modulo usa datos reales del backend cuando ya existen endpoints.
            </p>
          </div>
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => void loadConsole({ notifyOnError: true })}>
            Refrescar datos
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            helper={card.helper}
            icon={card.icon}
            onClick={() => scrollToSection(card.sectionId)}
          />
        ))}
      </section>

      <ResourceSection<AdminConsoleUser>
        id="a-usuarios"
        title="Usuarios"
        description="Consulta transversal de usuarios registrados, rol principal, sesiones y estado operativo."
        rows={data.users}
        filters={["Todos", "Activos", "Inactivos", "Candidato", "Reclutador", "Administrador"]}
        defaultFilter="Todos"
        searchPlaceholder="Buscar por nombre, correo o empresa"
        getFilterValue={(row) => {
          if (!row.isActive) {
            return "Inactivos";
          }

          return formatUserRole(row.roleCode);
        }}
        matchesSearch={(row, search) =>
          [row.fullName, row.email, row.companyName ?? "", formatUserRole(row.roleCode)]
            .map(normalizeText)
            .some((value) => value.includes(search))
        }
        columns={[
          {
            key: "user",
            label: "Usuario",
            render: (row) => (
              <div>
                <p className="font-medium">{row.fullName}</p>
                <p className="text-sm text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          {
            key: "role",
            label: "Rol",
            render: (row) => statusBadge(formatUserRole(row.roleCode)),
          },
          {
            key: "company",
            label: "Empresa",
            render: (row) => row.companyName ?? "Sin empresa",
          },
          {
            key: "state",
            label: "Estado",
            render: (row) => statusBadge(row.isActive ? "Activo" : "Inactivo"),
          },
          {
            key: "sessions",
            label: "Sesiones",
            render: (row) => String(row.sessions),
          },
        ]}
        emptyTitle="No hay usuarios para este filtro"
        emptyDescription="Cuando existan usuarios registrados o ajustes el filtro de busqueda, apareceran aqui."
      />

      <ResourceSection<AdminConsoleCompany>
        id="a-empresas"
        title="Empresas"
        description="Panorama de empresas, aprobacion, actividad y uso general del ecosistema."
        rows={data.companies}
        filters={["Todos", "Activa", "Sin cargas gratuitas", "Plan activo", "Rechazada"]}
        defaultFilter="Todos"
        searchPlaceholder="Buscar empresa, RUC, industria o ubicacion"
        getFilterValue={(row) => formatOperationalCompanyStatus(row.operationalStatus)}
        matchesSearch={(row, search) =>
          [
            row.name,
            row.commercialName ?? "",
            row.taxId ?? "",
            row.industry ?? "",
            row.address ?? "",
            row.billingEmail ?? "",
            row.city ?? "",
            row.country ?? "",
            row.activePlanName,
            formatOperationalCompanyStatus(row.operationalStatus),
          ]
            .map(normalizeText)
            .some((value) => value.includes(search))
        }
        columns={[
          {
            key: "company",
            label: "Empresa",
            render: (row) => (
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">
                  {row.commercialName || "Sin nombre comercial"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[row.city, row.country].filter(Boolean).join(", ") || "Sin ubicacion"}
                </p>
              </div>
            ),
          },
          {
            key: "details",
            label: "Datos",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p>RUC: {row.taxId || "Sin RUC"}</p>
                <p>Direccion: {row.address || "Sin direccion"}</p>
                <p>Sector: {row.industry || "Sin sector"}</p>
                <p>Cargo responsable: {row.contactPosition || "Sin cargo"}</p>
                <p>Facturacion: {row.billingEmail || "Sin correo"}</p>
              </div>
            ),
          },
          {
            key: "status",
            label: "Estado",
            render: (row) => statusBadge(formatOperationalCompanyStatus(row.operationalStatus)),
          },
          {
            key: "users",
            label: "Usuarios",
            render: (row) => String(row.users),
          },
          {
            key: "jobs",
            label: "Vacantes",
            render: (row) => String(row.jobs),
          },
          {
            key: "plan",
            label: "Plan",
            render: (row) => (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{row.activePlanName}</p>
                <p className="text-muted-foreground">
                  {row.hasActiveSubscription
                    ? "Suscripcion activa"
                    : `${row.freePostsRemaining} cargas gratuitas disponibles`}
                </p>
              </div>
            ),
          },
        ]}
        emptyTitle="No hay empresas registradas"
        emptyDescription="Las nuevas empresas aprobadas o pendientes apareceran en esta vista."
      />

      <ResourceSection<AdminConsoleJob>
        id="a-vacantes"
        title="Vacantes"
        description="Inventario de vacantes con su estado de moderacion, publicacion y traccion de postulaciones."
        rows={data.jobs}
        filters={["Todos", "Publicada", "Borrador", "Pausada", "Cerrada"]}
        defaultFilter="Todos"
        searchPlaceholder="Buscar vacante, empresa o ubicacion"
        getFilterValue={(row) => formatJobStatus(row.status)}
        matchesSearch={(row, search) =>
          [row.title, row.companyName, row.city ?? "", row.country ?? "", formatJobStatus(row.status)]
            .map(normalizeText)
            .some((value) => value.includes(search))
        }
        columns={[
          {
            key: "job",
            label: "Vacante",
            render: (row) => (
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-sm text-muted-foreground">{row.companyName}</p>
              </div>
            ),
          },
          {
            key: "status",
            label: "Estado",
            render: (row) => statusBadge(formatJobStatus(row.status)),
          },
          {
            key: "applications",
            label: "Postulaciones",
            render: (row) => String(row.applications),
          },
          {
            key: "publishedAt",
            label: "Publicacion",
            render: (row) => formatDate(row.publishedAt ?? row.createdAt),
          },
        ]}
        emptyTitle="No hay vacantes disponibles"
        emptyDescription="Cuando se creen o moderen vacantes, podras administrarlas desde este bloque."
      />

      <ResourceSection<AdminConsoleApplication>
        id="a-postulaciones"
        title="Postulaciones"
        description="Seguimiento integral del pipeline de candidatos, compatibilidad y estado del proceso."
        rows={data.applications}
        filters={["Todos", "Enviado", "En revision", "Preseleccionado", "Entrevista", "Rechazado", "Contratado"]}
        defaultFilter="Todos"
        searchPlaceholder="Buscar candidato, vacante o empresa"
        getFilterValue={(row) => formatApplicationStatus(row.status)}
        matchesSearch={(row, search) =>
          [row.candidateName, row.candidateEmail, row.jobTitle, row.companyName, formatApplicationStatus(row.status)]
            .map(normalizeText)
            .some((value) => value.includes(search))
        }
        columns={[
          {
            key: "candidate",
            label: "Candidato",
            render: (row) => (
              <div>
                <p className="font-medium">{row.candidateName}</p>
                <p className="text-sm text-muted-foreground">{row.candidateEmail}</p>
              </div>
            ),
          },
          {
            key: "job",
            label: "Vacante",
            render: (row) => (
              <div>
                <p className="font-medium">{row.jobTitle}</p>
                <p className="text-sm text-muted-foreground">{row.companyName}</p>
              </div>
            ),
          },
          {
            key: "status",
            label: "Estado",
            render: (row) => statusBadge(formatApplicationStatus(row.status)),
          },
          {
            key: "score",
            label: "Compatibilidad",
            render: (row) => `${row.compatibilityScore}%`,
          },
        ]}
        emptyTitle="No hay postulaciones registradas"
        emptyDescription="Las aplicaciones reales apareceran aqui con su estado y compatibilidad."
      />

      <ResourceSection<AdminConsolePayment>
        id="a-pagos"
        title="Pagos y suscripciones"
        description="Cobros, proveedores de pago y contexto del plan asociado a cada transaccion."
        rows={data.payments}
        filters={["Todos", "Pagado", "Pendiente", "Fallido", "Reembolsado"]}
        defaultFilter="Todos"
        searchPlaceholder="Buscar empresa, plan o proveedor"
        getFilterValue={(row) => formatPaymentStatus(row.status)}
        matchesSearch={(row, search) =>
          [row.companyName, row.planName, row.provider, formatPaymentStatus(row.status)]
            .map(normalizeText)
            .some((value) => value.includes(search))
        }
        columns={[
          {
            key: "company",
            label: "Empresa",
            render: (row) => (
              <div>
                <p className="font-medium">{row.companyName}</p>
                <p className="text-sm text-muted-foreground">{row.planName}</p>
              </div>
            ),
          },
          {
            key: "provider",
            label: "Proveedor",
            render: (row) => statusBadge(row.provider),
          },
          {
            key: "status",
            label: "Estado",
            render: (row) => statusBadge(formatPaymentStatus(row.status)),
          },
          {
            key: "amount",
            label: "Monto",
            render: (row) => formatCurrency(row.amount, row.currency),
          },
        ]}
        emptyTitle="No hay pagos conciliados"
        emptyDescription="A medida que existan transacciones, esta tabla mostrara proveedores, planes y estados."
      />

      <ResourceSection<AdminConsoleInvoice>
        id="a-facturas"
        title="Facturas"
        description="Control financiero de facturas emitidas, pagadas o pendientes por plan y empresa."
        rows={data.invoices}
        filters={["Todos", "Pagada", "Emitida", "Borrador", "Fallida", "Anulada"]}
        defaultFilter="Todos"
        searchPlaceholder="Buscar factura, empresa o plan"
        getFilterValue={(row) => formatInvoiceStatus(row.status)}
        matchesSearch={(row, search) =>
          [row.invoiceNumber, row.companyName, row.planName, formatInvoiceStatus(row.status)]
            .map(normalizeText)
            .some((value) => value.includes(search))
        }
        columns={[
          {
            key: "invoice",
            label: "Factura",
            render: (row) => (
              <div>
                <p className="font-medium">{row.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">{row.companyName}</p>
              </div>
            ),
          },
          {
            key: "plan",
            label: "Plan",
            render: (row) => row.planName,
          },
          {
            key: "status",
            label: "Estado",
            render: (row) => statusBadge(formatInvoiceStatus(row.status)),
          },
          {
            key: "total",
            label: "Total",
            render: (row) => formatCurrency(row.total, row.currency),
          },
        ]}
        emptyTitle="No hay facturas en el sistema"
        emptyDescription="Cuando la capa de billing genere facturas, podras administrarlas desde este modulo."
      />

      <ResourceSection<AdminConsoleDocument>
        id="a-documentos"
        title="Documentos"
        description="Inventario de archivos privados cargados por candidatos y disponibles para auditoria administrativa."
        rows={data.documents}
        filters={["Todos", "Hoja de vida", "Identificacion", "Certificado", "Licencia", "Otro"]}
        defaultFilter="Todos"
        searchPlaceholder="Buscar archivo, candidato o tipo"
        getFilterValue={(row) => formatDocumentType(row.type)}
        matchesSearch={(row, search) =>
          [row.fileName, row.candidateName, row.candidateEmail, formatDocumentType(row.type)]
            .map(normalizeText)
            .some((value) => value.includes(search))
        }
        columns={[
          {
            key: "file",
            label: "Documento",
            render: (row) => (
              <div>
                <p className="font-medium">{row.fileName}</p>
                <p className="text-sm text-muted-foreground">{row.candidateName}</p>
              </div>
            ),
          },
          {
            key: "type",
            label: "Tipo",
            render: (row) => statusBadge(formatDocumentType(row.type)),
          },
          {
            key: "mime",
            label: "MIME",
            render: (row) => row.mimeType,
          },
          {
            key: "size",
            label: "Tamano",
            render: (row) => `${(row.size / 1024 / 1024).toFixed(2)} MB`,
          },
        ]}
        emptyTitle="No hay documentos cargados"
        emptyDescription="Los documentos de candidatos apareceran aqui cuando el modulo de storage tenga actividad."
      />

      {superAdmin ? (
      <Card id="a-auditoria" className="scroll-mt-24 rounded-[1.75rem] border-border/70 bg-card/90">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Auditoria</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Vista previa de eventos recientes. Para filtros avanzados entra a la pagina dedicada.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/admin/auditoria">Abrir auditoria completa</a>
          </Button>
        </CardHeader>
        <CardContent>
          {data.auditPreview.length === 0 ? (
            <EmptyState
              title="Sin eventos de auditoria"
              description="Los eventos criticos del sistema se mostraran aqui en cuanto existan acciones registradas."
              icon={<Shield className="size-5" />}
            />
          ) : (
            <DashboardTable
              columns={[
                {
                  key: "action",
                  label: "Accion",
                  render: (row: AdminConsoleAuditPreview) => statusBadge(row.action),
                },
                {
                  key: "user",
                  label: "Usuario",
                  render: (row: AdminConsoleAuditPreview) => row.user?.name ?? "Sistema",
                },
                {
                  key: "entity",
                  label: "Entidad",
                  render: (row: AdminConsoleAuditPreview) => row.entityType ?? "General",
                },
                {
                  key: "createdAt",
                  label: "Fecha",
                  render: (row: AdminConsoleAuditPreview) => formatDate(row.createdAt),
                },
              ]}
              rows={data.auditPreview}
            />
          )}
        </CardContent>
      </Card>
      ) : null}

      {superAdmin ? (
      <ResourceSection<(typeof securityRows)[number]>
        id="a-seguridad"
        title="Seguridad"
        description={`Alertas vivas del sistema. Fallos recientes de login: ${data.security.recentFailedLoginsCount}.`}
        rows={securityRows}
        filters={["Todos", "Alta", "Critica"]}
        defaultFilter="Todos"
        searchPlaceholder="Buscar correo, IP o detalle"
        getFilterValue={(row) => row.status}
        matchesSearch={(row, search) =>
          [row.type, row.principal, row.detail]
            .map(normalizeText)
            .some((value) => value.includes(search))
        }
        columns={[
          {
            key: "type",
            label: "Alerta",
            render: (row) => (
              <div>
                <p className="font-medium">{row.type}</p>
                <p className="text-sm text-muted-foreground">{row.detail}</p>
              </div>
            ),
          },
          {
            key: "principal",
            label: "Principal",
            render: (row) => row.principal,
          },
          {
            key: "status",
            label: "Severidad",
            render: (row) => statusBadge(row.status),
          },
          {
            key: "happenedAt",
            label: "Fecha",
            render: (row) => formatDate(row.happenedAt),
          },
        ]}
        emptyTitle="Sin alertas abiertas"
        emptyDescription="Cuando existan bloqueos, reuso de tokens o hallazgos relevantes, apareceran aqui."
      />
      ) : null}

      {superAdmin ? (
      <Card id="a-configuracion" className="scroll-mt-24 rounded-[1.75rem] border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-xl">Configuracion</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Estado actual de integraciones y controles globales detectados en el entorno.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {([
            ["Resend", data.configuration.resendConfigured],
            ["Supabase Storage", data.configuration.supabaseConfigured],
            ["Stripe", data.configuration.stripeConfigured],
            ["PayPal", data.configuration.paypalConfigured],
            ["PayPhone", data.configuration.payphoneConfigured],
            ["Audit logs", data.configuration.auditLogsEnabled],
            ["Security headers", data.configuration.securityHeadersEnabled],
          ] as Array<[string, boolean]>).map(([label, enabled]) => (
            <ConfigurationCard key={label} label={label} enabled={enabled} />
          ))}
        </CardContent>
      </Card>
      ) : null}
    </div>
  );
}
