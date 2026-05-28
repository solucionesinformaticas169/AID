"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getCompanyApplicationStatistics,
  getJobApplications,
  updateApplicationStatus,
  type CompanyApplicationStatistics,
  type CompanyJobApplicant,
} from "@/lib/api/applications";
import {
  buildDocumentFileUrl,
  getCandidateDocumentsByProfile,
} from "@/lib/api/documents";
import {
  createJob,
  getCompanyJobs,
  updateJob,
  updateJobVisibility,
  type CompanyJob,
} from "@/lib/api/jobs";
import {
  createCheckout,
  confirmPayphoneButtonPayment,
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

const vacancyFilters = ["Todas", "Borrador", "Publicada", "Pausada", "Cerrada"];
const providerLabels = {
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
  PAYPHONE: "PayPhone",
} as const;
const applicationStatusOrder = [
  "APPLIED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "REJECTED",
  "HIRED",
] as const;
const employmentCountry = "Ecuador";
const companyTablePageSize = 8;

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
  const labels: Record<string, string> = {
    PAID: "Pagado",
    PENDING: "Pendiente",
    FAILED: "Fallido",
    REFUNDED: "Reembolsado",
    ISSUED: "Emitida",
    DRAFT: "Borrador",
    VOID: "Anulada",
    ACTIVE: "Activa",
    CANCELED: "Cancelada",
    CANCELLED: "Cancelada",
  };

  return (
    labels[status] ??
    status
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/(^\w)|(\s\w)/g, (match) => match.toUpperCase())
  );
}

function formatApplicationStatus(status: string) {
  const labels: Record<string, string> = {
    APPLIED: "Enviado",
    REVIEWING: "En revision",
    SHORTLISTED: "Preseleccionado",
    INTERVIEW: "Entrevista",
    REJECTED: "Rechazado",
    HIRED: "Contratado",
  };

  return labels[status] ?? status;
}

function formatJobStatus(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicada",
    PAUSED: "Pausada",
    CLOSED: "Cerrada",
  };

  return labels[status] ?? status;
}

function formatDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function buildInvoicePdfUrl(invoiceId: string) {
  return `${getApiBaseUrl()}/invoices/${invoiceId}/pdf`;
}

function CandidateResumeView({ applicant }: { applicant: CompanyJobApplicant }) {
  const personalInfo = applicant.candidate.resume.personalInfo ?? {};
  const educationRecords = applicant.candidate.resume.educationRecords;
  const languageRecords = applicant.candidate.resume.languageRecords;
  const trainingRecords = applicant.candidate.resume.trainingRecords;
  const experienceRecords = applicant.candidate.resume.experienceRecords;
  const referenceRecords = applicant.candidate.resume.referenceRecords;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Perfil general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Nombre:</span> {applicant.candidate.name}</p>
            <p><span className="font-medium">Correo:</span> {applicant.candidate.email}</p>
            <p><span className="font-medium">Ciudad:</span> {applicant.candidate.resume.city || "Sin ciudad"}</p>
            <p><span className="font-medium">Pais:</span> {applicant.candidate.resume.country || "Sin pais"}</p>
            <p><span className="font-medium">Progreso del perfil:</span> {applicant.candidate.resume.profileCompletion}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Documento:</span> {personalInfo.documentNumber || "Sin dato"}</p>
            <p><span className="font-medium">Telefono:</span> {personalInfo.mobilePhone || "Sin dato"}</p>
            <p><span className="font-medium">Direccion:</span> {personalInfo.mainStreet || "Sin dato"}</p>
            <p><span className="font-medium">Provincia:</span> {personalInfo.province || "Sin dato"}</p>
            <p><span className="font-medium">Canton:</span> {personalInfo.canton || "Sin dato"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Instruccion formal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {educationRecords.length === 0 ? <p className="text-muted-foreground">Sin registros.</p> : educationRecords.map((record) => (
            <div key={record.id} className="rounded-xl border border-border/60 p-3">
              <p className="font-medium">{record.title}</p>
              <p>{record.institution}</p>
              <p className="text-muted-foreground">{record.level} {record.studyArea ? `· ${record.studyArea}` : ""} {record.graduationYear ? `· ${record.graduationYear}` : ""}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Experiencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {experienceRecords.length === 0 ? <p className="text-muted-foreground">Sin registros.</p> : experienceRecords.map((record) => (
            <div key={record.id} className="rounded-xl border border-border/60 p-3">
              <p className="font-medium">{record.position}</p>
              <p>{record.company}</p>
              <p className="text-muted-foreground">
                {[record.city, record.startDate, record.endDate || (record.currentlyWorking === "SI" ? "Actual" : "")].filter(Boolean).join(" · ")}
              </p>
              {record.responsibilities ? <p className="mt-2">{record.responsibilities}</p> : null}
              {record.achievements ? <p className="mt-2 text-muted-foreground">Logros: {record.achievements}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Idiomas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {languageRecords.length === 0 ? <p className="text-muted-foreground">Sin registros.</p> : languageRecords.map((record) => (
              <div key={record.id} className="rounded-xl border border-border/60 p-3">
                <p className="font-medium">{record.language}</p>
                <p className="text-muted-foreground">Oral: {record.spokenLevel || "Sin dato"} · Escrito: {record.writtenLevel || "Sin dato"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Capacitaciones y certificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {trainingRecords.length === 0 ? <p className="text-muted-foreground">Sin registros.</p> : trainingRecords.map((record) => (
              <div key={record.id} className="rounded-xl border border-border/60 p-3">
                <p className="font-medium">{record.eventName}</p>
                <p>{record.institution || "Institucion no especificada"}</p>
                <p className="text-muted-foreground">
                  {[record.eventType, record.certificationType, record.startDate, record.endDate].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.25rem] border-border/70 bg-background/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Referencias personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {referenceRecords.length === 0 ? <p className="text-muted-foreground">Sin registros.</p> : referenceRecords.map((record) => (
            <div key={record.id} className="rounded-xl border border-border/60 p-3">
              <p className="font-medium">{record.fullName}</p>
              <p className="text-muted-foreground">
                {[record.relationship, record.phone, record.email, record.city].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function JobApplicantsModalContent({
  jobTitle,
  applicants,
  onViewResume,
  onDownloadCv,
  onUpdateStatus,
}: {
  jobTitle: string;
  applicants: CompanyJobApplicant[];
  onViewResume: (applicant: CompanyJobApplicant) => void;
  onDownloadCv: (candidateProfileId: string) => Promise<void>;
  onUpdateStatus: (
    applicationId: string,
    status: (typeof applicationStatusOrder)[number],
  ) => Promise<void>;
}) {
  const [rows, setRows] = useState(applicants);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [activeDocumentProfileId, setActiveDocumentProfileId] = useState<string | null>(null);

  const handleStatusChange = async (
    applicationId: string,
    status: (typeof applicationStatusOrder)[number],
  ) => {
    setActiveApplicationId(applicationId);

    try {
      await onUpdateStatus(applicationId, status);
      setRows((current) =>
        current.map((row) => (row.id === applicationId ? { ...row, status } : row)),
      );
    } finally {
      setActiveApplicationId(null);
    }
  };

  const handleCvDownload = async (candidateProfileId: string) => {
    setActiveDocumentProfileId(candidateProfileId);

    try {
      await onDownloadCv(candidateProfileId);
    } finally {
      setActiveDocumentProfileId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin postulantes para esta vacante"
        description={`La vacante ${jobTitle} todavia no registra candidatos postulados.`}
        icon={<BriefcaseBusiness className="size-6" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DashboardTable
        columns={[
          {
            key: "candidate",
            label: "Candidatos",
            render: (row) => (
              <div>
                <p className="font-medium">{row.candidate.name}</p>
                <p className="text-sm text-muted-foreground">{row.candidate.email}</p>
              </div>
            ),
          },
          {
            key: "status",
            label: "Estado actual",
            render: (row) => (
              <Badge variant="outline">{formatApplicationStatus(row.status)}</Badge>
            ),
          },
          {
            key: "cv",
            label: "Hoja de vida",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewResume(row)}
                >
                  Ver CV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeDocumentProfileId === row.candidate.profileId}
                  onClick={() => void handleCvDownload(row.candidate.profileId)}
                >
                  Descargar CV
                </Button>
              </div>
            ),
          },
          {
            key: "update",
            label: "Actualizar",
            render: (row) => (
              <select
                className="flex h-10 min-w-[180px] rounded-md border border-input bg-background px-3 text-sm"
                value={row.status}
                disabled={activeApplicationId === row.id}
                onChange={(event) =>
                  void handleStatusChange(
                    row.id,
                    event.target.value as (typeof applicationStatusOrder)[number],
                  )
                }
              >
                {applicationStatusOrder.map((status) => (
                  <option key={status} value={status}>
                    {formatApplicationStatus(status)}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
        rows={rows}
      />
    </div>
  );
}

export function CompanyDashboardClient({ session }: CompanyDashboardClientProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [vacanciesPage, setVacanciesPage] = useState(1);
  const [billingSummary, setBillingSummary] = useState<BillingSummaryResponse | null>(null);
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [invoices, setInvoices] = useState<CompanyInvoice[]>([]);
  const [plans, setPlans] = useState<PersistedPlan[]>([]);
  const [companyJobs, setCompanyJobs] = useState<CompanyJob[]>([]);
  const [applicationStatistics, setApplicationStatistics] =
    useState<CompanyApplicationStatistics | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [activeCheckoutKey, setActiveCheckoutKey] = useState<string | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeApplicantsJobId, setActiveApplicantsJobId] = useState<string | null>(null);
  const { closeModal, openModal, showToast } = useFeedback();
  const searchParams = useSearchParams();

  const companyId = session?.companyId ?? process.env.NEXT_PUBLIC_DEMO_COMPANY_ID ?? "";

  const filteredVacancies = useMemo(
    () =>
      companyJobs.filter((vacancy) => {
        const matchesFilter =
          activeFilter === "Todas" || formatJobStatus(vacancy.status) === activeFilter;
        const matchesQuery =
          vacancy.title.toLowerCase().includes(query.toLowerCase()) ||
          [vacancy.city ?? "", vacancy.country ?? ""].join(" ").toLowerCase().includes(query.toLowerCase());

        return matchesFilter && matchesQuery;
      }),
    [activeFilter, companyJobs, query],
  );

  const totalVacanciesPages = Math.max(
    1,
    Math.ceil(filteredVacancies.length / companyTablePageSize),
  );
  const currentVacanciesPage = Math.min(vacanciesPage, totalVacanciesPages);
  const paginatedVacancies = filteredVacancies.slice(
    (currentVacanciesPage - 1) * companyTablePageSize,
    currentVacanciesPage * companyTablePageSize,
  );

  useEffect(() => {
    setVacanciesPage(1);
  }, [activeFilter, query]);

  useEffect(() => {
    if (vacanciesPage > totalVacanciesPages) {
      setVacanciesPage(totalVacanciesPages);
    }
  }, [totalVacanciesPages, vacanciesPage]);

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

        const [
          applicationStatisticsResponse,
          summaryResponse,
          paymentsResponse,
          invoicesResponse,
          plansResponse,
          companyJobsResponse,
        ] = await Promise.all([
          getCompanyApplicationStatistics(companyId),
          getCompanyBillingSummary(companyId),
          getCompanyPayments(companyId),
          getCompanyInvoices(companyId),
          getPlans(),
          getCompanyJobs(companyId),
        ]);

        setApplicationStatistics(applicationStatisticsResponse);
        setBillingSummary(summaryResponse);
        setPayments(paymentsResponse);
        setInvoices(invoicesResponse);
        setPlans(plansResponse);
        setCompanyJobs(companyJobsResponse);

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

  useEffect(() => {
    const billingState = searchParams.get("billing");
    const payphoneId = searchParams.get("id");
    const clientTransactionId = searchParams.get("clientTransactionId");

    if (billingState !== "payphone-return" || !payphoneId || !clientTransactionId) {
      if (billingState === "cancel") {
        showToast({
          title: "Pago cancelado",
          description: "El proceso de cobro fue cancelado antes de completarse.",
        });
        window.history.replaceState({}, "", "/empresa");
      }
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const response = await confirmPayphoneButtonPayment({
          id: Number(payphoneId),
          clientTransactionId,
        });

        if (!isActive) {
          return;
        }

        showToast({
          title: "Pago confirmado",
          description: response.message,
        });
        setIsRefreshing(true);
        void loadBillingData();
      } catch (error) {
        if (!isActive) {
          return;
        }

        showToast({
          title: "No se pudo confirmar el pago",
          description:
            error instanceof Error
              ? error.message
              : "PayPhone no pudo confirmar la transaccion.",
        });
      } finally {
        if (isActive) {
          window.history.replaceState({}, "", "/empresa");
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [loadBillingData, searchParams, showToast]);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    void loadBillingData({ showSuccessToast: true });
  };

  const buildJobPayload = useCallback((formData: FormData) => {
    const minimumYearsExperienceRaw = String(
      formData.get("minimumYearsExperience") ?? "",
    ).trim();
    const salaryMinRaw = String(formData.get("salaryMin") ?? "").trim();
    const salaryMaxRaw = String(formData.get("salaryMax") ?? "").trim();
    const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();
    const closesAtRaw = String(formData.get("closesAt") ?? "").trim();
    const requiredLanguages = String(formData.get("requiredLanguages") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const requiredCertifications = String(formData.get("requiredCertifications") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    return {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      requirements: String(formData.get("requirements") ?? "").trim() || undefined,
      responsibilities:
        String(formData.get("responsibilities") ?? "").trim() || undefined,
      benefits: String(formData.get("benefits") ?? "").trim() || undefined,
      city: String(formData.get("city") ?? "").trim() || undefined,
      country: employmentCountry,
      requiredEducationLevel:
        String(formData.get("requiredEducationLevel") ?? "").trim() || undefined,
      minimumYearsExperience: minimumYearsExperienceRaw
        ? Number(minimumYearsExperienceRaw)
        : undefined,
      salaryMin: salaryMinRaw ? Number(salaryMinRaw) : undefined,
      salaryMax: salaryMaxRaw ? Number(salaryMaxRaw) : undefined,
      publishedAt: publishedAtRaw ? new Date(publishedAtRaw).toISOString() : undefined,
      closesAt: closesAtRaw ? new Date(closesAtRaw).toISOString() : undefined,
      requiredLanguages: requiredLanguages.length > 0 ? requiredLanguages : undefined,
      requiredCertifications:
        requiredCertifications.length > 0 ? requiredCertifications : undefined,
    };
  }, []);

  const handleCreateJob = useCallback(
    async (formData: FormData) => {
      setIsCreatingJob(true);

      try {
        await createJob(buildJobPayload(formData));
        closeModal();
        showToast({
          title: "Vacante creada",
          description:
            "La vacante fue registrada correctamente en el backend de empresa.",
        });
        setIsRefreshing(true);
        void loadBillingData();
      } catch (error) {
        showToast({
          title: "No se pudo crear la vacante",
          description:
            error instanceof Error ? error.message : "Error inesperado al crear la vacante.",
        });
      } finally {
        setIsCreatingJob(false);
      }
    },
    [buildJobPayload, closeModal, loadBillingData, showToast],
  );

  const handleEditJob = useCallback(
    async (jobId: string, formData: FormData) => {
      setActiveJobId(jobId);

      try {
        await updateJob(jobId, buildJobPayload(formData));
        closeModal();
        showToast({
          title: "Vacante actualizada",
          description: "Los cambios fueron guardados correctamente.",
        });
        setIsRefreshing(true);
        void loadBillingData();
      } catch (error) {
        showToast({
          title: "No se pudo actualizar la vacante",
          description:
            error instanceof Error ? error.message : "Error inesperado al actualizar la vacante.",
        });
      } finally {
        setActiveJobId(null);
      }
    },
    [buildJobPayload, closeModal, loadBillingData, showToast],
  );

  const handleJobVisibility = useCallback(
    async (jobId: string, isActive: boolean) => {
      setActiveJobId(jobId);

      try {
        await updateJobVisibility(jobId, isActive);
        showToast({
          title: isActive ? "Vacante activada" : "Vacante inactivada",
          description: isActive
            ? "La vacante ya esta visible como activa."
            : "La vacante quedo inactiva correctamente.",
        });
        setIsRefreshing(true);
        void loadBillingData();
      } catch (error) {
        showToast({
          title: "No se pudo actualizar la vacante",
          description:
            error instanceof Error ? error.message : "Error inesperado al cambiar el estado.",
        });
      } finally {
        setActiveJobId(null);
      }
    },
    [loadBillingData, showToast],
  );

  const handleApplicationStatusUpdate = useCallback(
    async (
      applicationId: string,
      status: (typeof applicationStatusOrder)[number],
    ) => {
      try {
        await updateApplicationStatus(applicationId, {
          status,
        });
        showToast({
          title: "Estado actualizado",
          description: `La postulacion paso a ${formatApplicationStatus(status)}.`,
        });
        setIsRefreshing(true);
        void loadBillingData();
      } catch (error) {
        showToast({
          title: "No se pudo actualizar",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo cambiar el estado de la postulacion.",
        });
      }
    },
    [showToast],
  );

  const handleCandidateCvDownload = useCallback(
    async (candidateProfileId: string) => {
      try {
        const documents = await getCandidateDocumentsByProfile(candidateProfileId);
        const cvDocument = documents.find((document) => document.type === "CV");

        if (!cvDocument) {
          showToast({
            title: "Hoja de vida no disponible",
            description: "El postulante todavia no tiene una hoja de vida cargada en el sistema.",
          });
          return;
        }

        const documentUrl = buildDocumentFileUrl(cvDocument.id, { download: true });
        const link = document.createElement("a");
        link.href = documentUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();

        showToast({
          title: "Descarga iniciada",
          description: `Se inicio la descarga de ${cvDocument.fileName}.`,
        });
      } catch (error) {
        showToast({
          title: "No se pudo acceder al CV",
          description:
            error instanceof Error
              ? error.message
              : "No fue posible abrir la hoja de vida del postulante.",
        });
      }
    },
    [showToast],
  );

  const handleViewCandidateResume = useCallback(
    (applicant: CompanyJobApplicant) => {
      openModal({
        title: `Hoja de vida de ${applicant.candidate.name}`,
        description: "Resumen estructurado con la informacion que el candidato registro en el sistema.",
        content: <CandidateResumeView applicant={applicant} />,
      });
    },
    [openModal],
  );

  const handleOpenJobApplicants = useCallback(
    async (job: CompanyJob) => {
      setActiveApplicantsJobId(job.id);

      try {
        const applicants = await getJobApplications(job.id);

        openModal({
          title: `Postulantes de ${job.title}`,
          description: "Gestiona el estado del proceso y consulta las hojas de vida de esta vacante.",
          content: (
            <JobApplicantsModalContent
              jobTitle={job.title}
              applicants={applicants}
              onViewResume={handleViewCandidateResume}
              onDownloadCv={handleCandidateCvDownload}
              onUpdateStatus={handleApplicationStatusUpdate}
            />
          ),
        });
      } catch (error) {
        showToast({
          title: "No se pudieron cargar los postulantes",
          description:
            error instanceof Error ? error.message : "Error inesperado al cargar la vacante.",
        });
      } finally {
        setActiveApplicantsJobId(null);
      }
    },
    [handleApplicationStatusUpdate, handleCandidateCvDownload, handleViewCandidateResume, openModal, showToast],
  );

  const handleCheckout = useCallback(
    async (
      plan: PersistedPlan,
      provider: keyof typeof providerLabels,
      options?: {
        customerEmail?: string;
        payerPhoneNumber?: string;
        payerCountryCode?: string;
        billingFirstName?: string;
        billingLastName?: string;
        billingCompanyName?: string;
        billingContactPhone?: string;
        billingTaxId?: string;
        billingAddress?: string;
        billingCity?: string;
        billingCountry?: string;
      },
    ) => {
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
          customerEmail: options?.customerEmail ?? session?.email ?? undefined,
          payerPhoneNumber: options?.payerPhoneNumber,
          payerCountryCode: options?.payerCountryCode,
          billingFirstName: options?.billingFirstName,
          billingLastName: options?.billingLastName,
          billingCompanyName: options?.billingCompanyName,
          billingContactPhone: options?.billingContactPhone,
          billingTaxId: options?.billingTaxId,
          billingAddress: options?.billingAddress,
          billingCity: options?.billingCity,
          billingCountry: options?.billingCountry,
          successUrl: `${origin}/empresa?billing=payphone-return`,
          cancelUrl: `${origin}/empresa?billing=cancel`,
        });

        closeModal();
        showToast({
          title: `${providerLabels[provider]} preparado`,
          description: response.message,
        });

        if (response.checkout.checkoutUrl) {
          window.location.assign(response.checkout.checkoutUrl);
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
      const checkoutKey = `${plan.code}-PAYPHONE`;

      openModal({
        title: `Activar plan ${plan.name}`,
        description: "Completa los datos de facturacion para continuar con el cobro del plan.",
        content: (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);
              const customerEmail = String(formData.get("customerEmail") ?? "").trim();
              const payerPhoneNumber = String(formData.get("payerPhoneNumber") ?? "")
                .replace(/\D/g, "")
                .trim();
              const payerCountryCode = String(formData.get("payerCountryCode") ?? "593")
                .replace(/\D/g, "")
                .trim();
              const billingFirstName = String(formData.get("billingFirstName") ?? "").trim();
              const billingLastName = String(formData.get("billingLastName") ?? "").trim();
              const billingCompanyName = String(formData.get("billingCompanyName") ?? "").trim();
              const billingContactPhone = String(formData.get("billingContactPhone") ?? "").trim();
              const billingTaxId = String(formData.get("billingTaxId") ?? "").trim();
              const billingAddress = String(formData.get("billingAddress") ?? "").trim();
              const billingCity = String(formData.get("billingCity") ?? "").trim();
              const billingCountry = String(formData.get("billingCountry") ?? "Ecuador").trim();

              void handleCheckout(plan, "PAYPHONE", {
                customerEmail: customerEmail || undefined,
                payerPhoneNumber,
                payerCountryCode,
                billingFirstName,
                billingLastName,
                billingCompanyName,
                billingContactPhone,
                billingTaxId,
                billingAddress,
                billingCity,
                billingCountry,
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Nombres</label>
                <Input
                  name="billingFirstName"
                  required
                  placeholder="Ingresa los nombres del responsable"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Apellidos</label>
                <Input
                  name="billingLastName"
                  required
                  placeholder="Ingresa los apellidos del responsable"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Organizacion o empresa</label>
                <Input
                  name="billingCompanyName"
                  required
                  placeholder="Ingresa la razon social o nombre comercial"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Correo de facturacion</label>
                <Input
                  name="customerEmail"
                  type="email"
                  required
                  placeholder="Ingresa el correo de facturacion"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Telefono de contacto</label>
                <Input
                  name="billingContactPhone"
                  required
                  inputMode="numeric"
                  placeholder="Ej. 022345678 o 0999123456"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">RUC</label>
                <Input
                  name="billingTaxId"
                  required
                  inputMode="numeric"
                  placeholder="Ingresa el RUC de la empresa"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">Direccion</label>
                <Input
                  name="billingAddress"
                  required
                  placeholder="Ingresa la direccion de facturacion"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Ciudad</label>
                <Input
                  name="billingCity"
                  required
                  placeholder="Ingresa la ciudad"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Pais</label>
                <Input
                  name="billingCountry"
                  required
                  defaultValue="Ecuador"
                  disabled
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Codigo de pais</label>
                <Input
                  name="payerCountryCode"
                  required
                  defaultValue="593"
                  placeholder="593"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Telefono PayPhone</label>
                <Input
                  name="payerPhoneNumber"
                  required
                  inputMode="numeric"
                  placeholder="Ej. 999123456"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Al continuar prepararemos el cobro del plan. En la integracion actual, PayPhone enviara la solicitud al numero del titular que aprobara el pago.
            </p>
            <div className="flex justify-end">
              <Button type="submit" disabled={activeCheckoutKey === checkoutKey}>
                <CreditCard className="mr-2 size-4" />
                {activeCheckoutKey === checkoutKey
                  ? "Preparando pago..."
                  : "Continuar al pago"}
              </Button>
            </div>
          </form>
        ),
      });
    },
    [activeCheckoutKey, handleCheckout, openModal, session?.email],
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
  const atsStats = applicationStatusOrder.map((status) => {
    const row = applicationStatistics?.byStatus.find((item) => item.status === status);
    return {
      status,
      total: row?.total ?? 0,
    };
  });

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
                  description: "Completa los datos base para registrar una vacante nueva.",
                  content: (
                    <form
                      className="grid gap-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleCreateJob(new FormData(event.currentTarget));
                      }}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium">Titulo</label>
                          <Input name="title" required placeholder="Ej. Desarrollador Full Stack" />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Ciudad</label>
                          <Input name="city" placeholder="Ej. Cuenca" />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Anos de experiencia</label>
                          <Input
                            name="minimumYearsExperience"
                            type="number"
                            min={0}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Remuneracion minima</label>
                          <Input
                            name="salaryMin"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Ej. 800"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Remuneracion maxima</label>
                          <Input
                            name="salaryMax"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Ej. 1200"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Visible desde</label>
                          <Input name="publishedAt" type="datetime-local" />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Visible hasta</label>
                          <Input name="closesAt" type="datetime-local" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium">Descripcion</label>
                          <Textarea
                            name="description"
                            required
                            placeholder="Describe el rol, contexto y objetivo de la vacante."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium">Requisitos</label>
                          <Textarea
                            name="requirements"
                            placeholder="Conocimientos, herramientas, experiencia requerida."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium">Responsabilidades</label>
                          <Textarea
                            name="responsibilities"
                            placeholder="Responsabilidades principales del cargo."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium">Beneficios</label>
                          <Textarea
                            name="benefits"
                            placeholder="Beneficios, modalidad, bonos, extras."
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Nivel educativo</label>
                          <Input
                            name="requiredEducationLevel"
                            placeholder="Ej. Ingenieria en Sistemas"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Pais</label>
                          <Input value={employmentCountry} disabled />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium">Idiomas requeridos</label>
                          <Input
                            name="requiredLanguages"
                            placeholder="Ej. Ingles, Portugues"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium">Certificaciones requeridas</label>
                          <Input
                            name="requiredCertifications"
                            placeholder="Ej. Scrum, AWS Cloud Practitioner"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isCreatingJob}>
                          {isCreatingJob ? "Creando..." : "Crear vacante"}
                        </Button>
                      </div>
                    </form>
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
                        <p className="text-sm text-muted-foreground">
                          {[row.city, row.country].filter(Boolean).join(", ") || "Sin ubicacion"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: "Estado",
                    render: (row) => <Badge variant="outline">{formatJobStatus(row.status)}</Badge>,
                  },
                  {
                    key: "experience",
                    label: "Experiencia",
                    render: (row) => <span>{row.minimumYearsExperience} anos</span>,
                  },
                  {
                    key: "applicants",
                    label: "Postulantes",
                    render: (row) => <span className="font-medium">{row._count.applications}</span>,
                  },
                  {
                    key: "actions",
                    label: "Acciones",
                    render: (row) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={activeApplicantsJobId === row.id}
                          onClick={() => void handleOpenJobApplicants(row)}
                        >
                          {activeApplicantsJobId === row.id ? "Cargando..." : "Postulantes"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={activeJobId === row.id}
                          onClick={() =>
                            openModal({
                              title: "Editar vacante",
                              description: "Actualiza la informacion principal de esta vacante.",
                              content: (
                                <form
                                  className="grid gap-4"
                                  onSubmit={(event) => {
                                    event.preventDefault();
                                    void handleEditJob(row.id, new FormData(event.currentTarget));
                                  }}
                                >
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                      <label className="mb-2 block text-sm font-medium">Titulo</label>
                                      <Input
                                        name="title"
                                        required
                                        defaultValue={row.title}
                                        placeholder="Ej. Desarrollador Full Stack"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">Ciudad</label>
                                      <Input
                                        name="city"
                                        defaultValue={row.city ?? ""}
                                        placeholder="Ej. Cuenca"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">Anos de experiencia</label>
                                      <Input
                                        name="minimumYearsExperience"
                                        type="number"
                                        min={0}
                                        defaultValue={row.minimumYearsExperience}
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">Remuneracion minima</label>
                                      <Input
                                        name="salaryMin"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        defaultValue={row.salaryMin ?? ""}
                                        placeholder="Ej. 800"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">Remuneracion maxima</label>
                                      <Input
                                        name="salaryMax"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        defaultValue={row.salaryMax ?? ""}
                                        placeholder="Ej. 1200"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">Visible desde</label>
                                      <Input
                                        name="publishedAt"
                                        type="datetime-local"
                                        defaultValue={formatDateTimeLocalValue(row.publishedAt)}
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">Visible hasta</label>
                                      <Input
                                        name="closesAt"
                                        type="datetime-local"
                                        defaultValue={formatDateTimeLocalValue(row.closesAt)}
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="mb-2 block text-sm font-medium">Descripcion</label>
                                      <Textarea
                                        name="description"
                                        required
                                        defaultValue={row.description ?? ""}
                                        placeholder="Describe el rol, contexto y objetivo de la vacante."
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="mb-2 block text-sm font-medium">Requisitos</label>
                                      <Textarea
                                        name="requirements"
                                        defaultValue={row.requirements ?? ""}
                                        placeholder="Conocimientos, herramientas, experiencia requerida."
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="mb-2 block text-sm font-medium">Responsabilidades</label>
                                      <Textarea
                                        name="responsibilities"
                                        defaultValue={row.responsibilities ?? ""}
                                        placeholder="Responsabilidades principales del cargo."
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="mb-2 block text-sm font-medium">Beneficios</label>
                                      <Textarea
                                        name="benefits"
                                        defaultValue={row.benefits ?? ""}
                                        placeholder="Beneficios, modalidad, bonos, extras."
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">Nivel educativo</label>
                                      <Input
                                        name="requiredEducationLevel"
                                        defaultValue={row.requiredEducationLevel ?? ""}
                                        placeholder="Ej. Ingenieria en Sistemas"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">Pais</label>
                                      <Input value={row.country ?? employmentCountry} disabled />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="mb-2 block text-sm font-medium">Idiomas requeridos</label>
                                      <Input
                                        name="requiredLanguages"
                                        defaultValue={(row.requiredLanguages ?? []).join(", ")}
                                        placeholder="Ej. Ingles, Portugues"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="mb-2 block text-sm font-medium">Certificaciones requeridas</label>
                                      <Input
                                        name="requiredCertifications"
                                        defaultValue={(row.requiredCertifications ?? []).join(", ")}
                                        placeholder="Ej. Scrum, AWS Cloud Practitioner"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end">
                                    <Button type="submit" disabled={activeJobId === row.id}>
                                      {activeJobId === row.id ? "Guardando..." : "Guardar cambios"}
                                    </Button>
                                  </div>
                                </form>
                              ),
                            })
                          }
                        >
                          Editar
                        </Button>
                        <Button
                          variant={row.status === "PUBLISHED" ? "secondary" : "default"}
                          size="sm"
                          disabled={activeJobId === row.id}
                          onClick={() =>
                            void handleJobVisibility(row.id, row.status !== "PUBLISHED")
                          }
                        >
                          {activeJobId === row.id
                            ? "Actualizando..."
                            : row.status === "PUBLISHED"
                              ? "Inactivar"
                              : "Activar"}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                rows={paginatedVacancies}
              />
            )}
            {filteredVacancies.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredVacancies.length} registros - pagina {currentVacanciesPage} de {totalVacanciesPages}
                </p>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={currentVacanciesPage === 1}
                    onClick={() => setVacanciesPage((value) => Math.max(1, value - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={currentVacanciesPage >= totalVacanciesPages}
                    onClick={() =>
                      setVacanciesPage((value) => Math.min(totalVacanciesPages, value + 1))
                    }
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
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
              {atsStats.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-[1.25rem] border border-border/70 bg-background/60 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{formatApplicationStatus(item.status)}</span>
                  <span className="text-xl font-semibold">{item.total}</span>
                </div>
              ))}
              <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
                Total de postulaciones: {applicationStatistics?.totalApplications ?? 0}. Compatibilidad promedio: {applicationStatistics?.averageCompatibility ?? 0}%.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Planes SaaS</CardTitle>
            <Badge variant="secondary">PayPhone</Badge>
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
              <CardTitle className="text-xl">Facturacion y facturas</CardTitle>
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
                  title="Sin facturas emitidas"
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
                          title: "Factura abierta",
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
  );
}
