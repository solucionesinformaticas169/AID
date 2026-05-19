"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  Layers3,
  Search,
  ShieldAlert,
  Star,
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
import {
  createCheckout,
  getApiBaseUrl,
  getCompanyBillingSummary,
  getCompanyInvoices,
  getCompanyPayments,
  getPlans,
  type BillingSummaryResponse,
  type CompanyInvoice,
  type CompanyPayment,
  type PersistedPlan,
} from "@/lib/api/payments";
import type { SessionUser } from "@/lib/auth/session";
import { companyApplicationStats, vacancies } from "@/lib/mock-data";

const vacancyFilters = ["Todas", "Hibrido", "Remoto", "Presencial"];
const providerLabels = {
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
  PAYPHONE: "PayPhone",
} as const;

type CompanyDashboardClientProps = {
  session: SessionUser | null;
};

function formatCurrency(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^\w)|(\s\w)/g, (match) => match.toUpperCase());
}

function buildInvoicePdfUrl(invoiceId: string) {
  return `${getApiBaseUrl()}/payments/invoices/${invoiceId}/pdf`;
}

export function CompanyDashboardClient({ session }: CompanyDashboardClientProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [billingSummary, setBillingSummary] = useState<BillingSummaryResponse | null>(null);
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [invoices, setInvoices] = useState<CompanyInvoice[]>([]);
  const [plans, setPlans] = useState<PersistedPlan[]>([]);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [activeCheckoutKey, setActiveCheckoutKey] = useState<string | null>(null);
  const { closeModal, openModal, showToast } = useFeedback();

  const companyId = session?.companyId ?? process.env.NEXT_PUBLIC_DEMO_COMPANY_ID ?? "";

  const filteredVacancies = useMemo(
    () =>
      vacancies.filter((vacancy) => {
        const matchesFilter =
          activeFilter === "Todas" || vacancy.modality.toLowerCase() === activeFilter.toLowerCase();
        const matchesQuery =
          vacancy.title.toLowerCase().includes(query.toLowerCase()) ||
          vacancy.location.toLowerCase().includes(query.toLowerCase());

        return matchesFilter && matchesQuery;
      }),
    [activeFilter, query],
  );

  const loadBillingData = useCallback(
    async (options?: { showSuccessToast?: boolean }) => {
      if (!companyId) {
        setBillingError("No hay una empresa asociada a la sesion actual.");
        setIsBillingLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        setBillingError(null);

        const [summaryResponse, paymentsResponse, invoicesResponse, plansResponse] = await Promise.all([
          getCompanyBillingSummary(companyId),
          getCompanyPayments(companyId),
          getCompanyInvoices(companyId),
          getPlans(),
        ]);

        setBillingSummary(summaryResponse);
        setPayments(paymentsResponse);
        setInvoices(invoicesResponse);
        setPlans(plansResponse);

        if (options?.showSuccessToast) {
          showToast({
            title: "Billing sincronizado",
            description: "El estado del plan, pagos e invoices ya viene del backend real.",
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo cargar la informacion de facturacion.";

        setBillingError(message);
        showToast({
          title: "Error de sincronizacion",
          description: message,
        });
      } finally {
        setIsBillingLoading(false);
        setIsRefreshing(false);
      }
    },
    [companyId, showToast],
  );

  useEffect(() => {
    if (!companyId) {
      setIsBillingLoading(false);
      setBillingError("Configura un companyId en la sesion o en NEXT_PUBLIC_DEMO_COMPANY_ID.");
      return;
    }

    void loadBillingData();
  }, [companyId, loadBillingData]);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    void loadBillingData({ showSuccessToast: true });
  };

  const handleCheckout = useCallback(
    async (plan: PersistedPlan, provider: keyof typeof providerLabels) => {
      if (!companyId) {
        showToast({
          title: "Empresa no identificada",
          description: "No es posible iniciar el checkout sin un companyId disponible.",
        });
        return;
      }

      const checkoutKey = `${plan.code}-${provider}`;
      setActiveCheckoutKey(checkoutKey);

      try {
        const origin = window.location.origin;
        const response = await createCheckout({
          companyId,
          planCode: plan.code,
          provider,
          customerEmail: session?.email ?? undefined,
          successUrl: `${origin}/empresa?billing=success`,
          cancelUrl: `${origin}/empresa?billing=cancel`,
        });

        closeModal();
        showToast({
          title: `${providerLabels[provider]} preparado`,
          description: response.message,
        });

        if (response.checkout.checkoutUrl) {
          window.open(response.checkout.checkoutUrl, "_blank", "noopener,noreferrer");
        }

        setIsRefreshing(true);
        void loadBillingData();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo iniciar el checkout.";

        showToast({
          title: "Checkout no disponible",
          description: message,
        });
      } finally {
        setActiveCheckoutKey(null);
      }
    },
    [closeModal, companyId, loadBillingData, session?.email, showToast],
  );

  const openCheckoutModal = useCallback(
    (plan: PersistedPlan) => {
      openModal({
        title: `Activar plan ${plan.name}`,
        description: "Selecciona un proveedor de pago para iniciar el checkout SaaS real.",
        content: (
          <div className="grid gap-3">
            {(["STRIPE", "PAYPAL", "PAYPHONE"] as const).map((provider) => {
              const checkoutKey = `${plan.code}-${provider}`;

              return (
                <Button
                  key={provider}
                  variant="outline"
                  disabled={activeCheckoutKey === checkoutKey}
                  onClick={() => void handleCheckout(plan, provider)}
                >
                  <CreditCard className="mr-2 size-4" />
                  {activeCheckoutKey === checkoutKey
                    ? "Preparando checkout..."
                    : `Pagar con ${providerLabels[provider]}`}
                </Button>
              );
            })}
          </div>
        ),
      });
    },
    [activeCheckoutKey, handleCheckout, openModal],
  );

  if (isBillingLoading) {
    return <DashboardSkeleton />;
  }

  if (!companyId) {
    return (
      <EmptyState
        title="Empresa no configurada"
        description="La sesion actual no trae companyId. Vincula una empresa al usuario o define NEXT_PUBLIC_DEMO_COMPANY_ID para el entorno demo."
        icon={<ShieldAlert className="size-6" />}
      />
    );
  }

  const planStatus = billingSummary?.planStatus ?? null;
  const activePlanCode = planStatus?.activePlan;
  const freePostsProgress =
    planStatus && planStatus.freePostsIncluded > 0
      ? Math.min((planStatus.freePostsUsed / planStatus.freePostsIncluded) * 100, 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Vacantes publicadas"
          value={String(planStatus?.publishedJobsCount ?? 0)}
          helper="Conteo real segun el plan y publicaciones activas."
          icon={<BriefcaseBusiness className="size-5" />}
        />
        <StatCard
          label="Cargas gratuitas restantes"
          value={String(planStatus?.freePostsRemaining ?? 0)}
          helper="Saldo vivo de publicaciones gratuitas disponibles."
          icon={<Layers3 className="size-5" />}
        />
        <StatCard
          label="Pagos registrados"
          value={String(payments.length)}
          helper="Historial consolidado desde la capa de billing SaaS."
          icon={<BarChart3 className="size-5" />}
        />
      </div>

      <Card className="rounded-[1.5rem] border-border/60 bg-card/85">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar vacantes o ubicacion" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterPillGroup items={vacancyFilters} activeItem={activeFilter} onChange={setActiveFilter} />
            <Button variant="outline" disabled={isRefreshing} onClick={triggerRefresh}>
              {isRefreshing ? "Sincronizando..." : "Actualizar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Vacantes y postulantes</CardTitle>
            <Button
              onClick={() =>
                openModal({
                  title: "Nueva vacante",
                  description: "Sistema modal para alta rapida inspirado en Workday.",
                  content: (
                    <p className="text-sm text-muted-foreground">
                      Aqui podemos enchufar el formulario conectado a la API cuando pases a la siguiente orden.
                    </p>
                  ),
                })
              }
            >
              Crear vacante
            </Button>
          </CardHeader>
          <CardContent>
            {filteredVacancies.length === 0 ? (
              <EmptyState
                title="No hay vacantes visibles"
                description="Ajusta los filtros o crea una nueva vacante para alimentar el tablero."
                icon={<BriefcaseBusiness className="size-6" />}
              />
            ) : (
              <DashboardTable
                columns={[
                  {
                    key: "title",
                    label: "Cargo",
                    render: (row) => (
                      <div>
                        <p className="font-medium">{row.title}</p>
                        <p className="text-sm text-muted-foreground">{row.location}</p>
                      </div>
                    ),
                  },
                  {
                    key: "modality",
                    label: "Modalidad",
                    render: (row) => <Badge variant="outline">{row.modality}</Badge>,
                  },
                  {
                    key: "salary",
                    label: "Rango",
                    render: (row) => <span>{row.salary}</span>,
                  },
                  {
                    key: "applicants",
                    label: "Postulantes",
                    render: (row) => (
                      <span className="font-medium">
                        {Math.max(4, 14 - vacancies.findIndex((item) => item.id === row.id) * 2)}
                      </span>
                    ),
                  },
                ]}
                rows={filteredVacancies}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Uso del plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {planStatus ? (
                <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{planStatus.activePlanName}</p>
                    <Badge>{planStatus.freePostsRemaining} cargas restantes</Badge>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-muted">
                    <div
                      className="h-3 rounded-full bg-primary transition-all"
                      style={{ width: `${freePostsProgress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {planStatus.freePostsUsed} de {planStatus.freePostsIncluded} publicaciones gratuitas consumidas.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{planStatus.publicationRule}</p>
                </div>
              ) : (
                <EmptyState
                  title="Sin resumen de plan"
                  description={billingError ?? "No fue posible obtener el estado del plan actual."}
                  icon={<Layers3 className="size-6" />}
                  action={
                    <Button variant="outline" onClick={triggerRefresh}>
                      Reintentar
                    </Button>
                  }
                />
              )}
              <Button className="w-full" variant="outline" disabled={isRefreshing} onClick={triggerRefresh}>
                {isRefreshing ? "Actualizando..." : "Actualizar plan"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Estadisticas ATS</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {companyApplicationStats.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/60 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{item.status}</span>
                  <span className="text-xl font-semibold">{item.total}</span>
                </div>
              ))}
              <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                Prioridad en publicaciones: {planStatus?.priorityPublication ? "Activa" : "No incluida"}.
                Metricas avanzadas: {planStatus?.advancedMetrics ? "Disponibles" : "Basicas"}.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Planes SaaS</CardTitle>
            <Badge variant="secondary">Stripe · PayPal · PayPhone</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {plans.length === 0 ? (
              <div className="lg:col-span-3">
                <EmptyState
                  title="Catalogo de planes vacio"
                  description={billingError ?? "Sin planes persistidos en el backend todavia."}
                  icon={<Star className="size-6" />}
                />
              </div>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.code}
                  className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{plan.name}</p>
                    {activePlanCode === plan.code ? (
                      <Badge>Activo</Badge>
                    ) : (
                      <Star className="size-4 text-primary" />
                    )}
                  </div>
                  <p className="mt-3 text-2xl font-semibold">
                    {formatCurrency(plan.price, plan.currency)}
                    {plan.durationMonths > 0 ? (
                      <span className="text-base font-normal text-muted-foreground"> / {plan.durationMonths} mes</span>
                    ) : null}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>Limite: {plan.jobPostLimit === null ? "Ilimitadas" : `${plan.jobPostLimit} vacantes`}</p>
                    <p>Prioridad: {plan.priorityPublication ? "Si" : "No"}</p>
                    <p>Metricas: {plan.advancedMetrics ? "Avanzadas" : "Basicas"}</p>
                    <p>Candidatos destacados: {plan.featuredCandidates ? "Si" : "No"}</p>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    variant={plan.code === "FREE" ? "outline" : "default"}
                    disabled={plan.code === activePlanCode}
                    onClick={() => openCheckoutModal(plan)}
                  >
                    {plan.code === activePlanCode ? "Plan activo" : "Elegir"}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Historial de pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {billingError ? (
                <EmptyState
                  title="No se pudieron cargar los pagos"
                  description={billingError}
                  icon={<CreditCard className="size-6" />}
                  action={
                    <Button variant="outline" onClick={triggerRefresh}>
                      Reintentar
                    </Button>
                  }
                />
              ) : payments.length === 0 ? (
                <EmptyState
                  title="Sin pagos registrados"
                  description="Todavia no hay cobros asociados a esta empresa en la capa SaaS."
                  icon={<CreditCard className="size-6" />}
                />
              ) : (
                <DashboardTable
                  columns={[
                    { key: "provider", label: "Proveedor", render: (row) => providerLabels[row.provider] },
                    { key: "plan", label: "Plan", render: (row) => row.subscription.plan.name },
                    {
                      key: "amount",
                      label: "Monto",
                      render: (row) => formatCurrency(row.amount, row.currency),
                    },
                    {
                      key: "status",
                      label: "Estado",
                      render: (row) => <Badge variant="outline">{formatStatus(row.status)}</Badge>,
                    },
                  ]}
                  rows={payments}
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-xl">Facturacion e invoices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {billingError ? (
                <EmptyState
                  title="No se pudieron cargar las facturas"
                  description={billingError}
                  icon={<FileText className="size-6" />}
                  action={
                    <Button variant="outline" onClick={triggerRefresh}>
                      Reintentar
                    </Button>
                  }
                />
              ) : invoices.length === 0 ? (
                <EmptyState
                  title="Sin invoices emitidas"
                  description="Las facturas apareceran aqui cuando exista una suscripcion o un pago confirmado."
                  icon={<FileText className="size-6" />}
                />
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-border/70 bg-background/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.plan.name} · {formatCurrency(invoice.total, invoice.currency)} · {formatDate(invoice.issuedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(buildInvoicePdfUrl(invoice.id), "_blank", "noopener,noreferrer");
                        showToast({
                          title: "Invoice abierta",
                          description: `Se abrio la factura ${invoice.invoiceNumber} desde el backend.`,
                        });
                      }}
                    >
                      <FileText className="mr-2 size-4" />
                      {formatStatus(invoice.status)}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
