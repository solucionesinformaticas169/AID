"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Filter, MapPin, Search } from "lucide-react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicJobs, type PublicJob } from "@/lib/api/jobs";
import { vacancies } from "@/lib/mock-data";

type AdvancedJobFilters = {
  offerCode: string;
  title: string;
  publishedFrom: string;
  publishedTo: string;
  location: string;
  modality: string;
  employmentType: string;
  minSalary: string;
  requirements: string;
};

const defaultAdvancedFilters: AdvancedJobFilters = {
  offerCode: "",
  title: "",
  publishedFrom: "",
  publishedTo: "",
  location: "",
  modality: "",
  employmentType: "",
  minSalary: "",
  requirements: "",
};

const fallbackPublicJobs: PublicJob[] = vacancies.map((vacancy, index) => ({
  id: vacancy.id,
  slug: vacancy.id,
  title: vacancy.title,
  description: vacancy.summary,
  requirements: vacancy.summary,
  responsibilities: vacancy.summary,
  benefits: null,
  city: vacancy.location.split(",")[0] ?? vacancy.location,
  country: vacancy.location.includes(",") ? vacancy.location.split(",").slice(1).join(",").trim() : "Ecuador",
  modality: normalizeMockModality(vacancy.modality),
  employmentType: "FULL_TIME",
  requiredEducationLevel: null,
  minimumYearsExperience: 0,
  requiredLanguages: [],
  requiredCertifications: [],
  salaryMin: extractSalaryMin(vacancy.salary),
  salaryMax: extractSalaryMax(vacancy.salary),
  status: "PUBLISHED",
  freePublication: false,
  priorityPublication: index === 0,
  publishedAt: new Date(Date.now() - index * 86_400_000).toISOString(),
  closesAt: null,
  createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
  company: {
    id: `demo-company-${index + 1}`,
    name: vacancy.company,
    slug: vacancy.company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    city: vacancy.location.split(",")[0] ?? vacancy.location,
    country: "Ecuador",
  },
}));

function normalizeMockModality(modality: string) {
  if (modality.toLowerCase().includes("remoto")) {
    return "REMOTE";
  }

  if (modality.toLowerCase().includes("hibr")) {
    return "HYBRID";
  }

  return "ON_SITE";
}

function extractSalaryMin(salary: string) {
  const matches = salary.match(/\$?([\d,]+)/g);
  const first = matches?.[0]?.replace(/[^0-9]/g, "");
  return first ? Number(first) : null;
}

function extractSalaryMax(salary: string) {
  const matches = salary.match(/\$?([\d,]+)/g);
  const second = matches?.[1]?.replace(/[^0-9]/g, "");
  return second ? Number(second) : extractSalaryMin(salary);
}

function formatWorkModality(modality: PublicJob["modality"]) {
  const labels: Record<NonNullable<PublicJob["modality"]>, string> = {
    ON_SITE: "Presencial",
    HYBRID: "Hibrido",
    REMOTE: "Remoto",
  };

  return modality ? labels[modality] : "Por definir";
}

function formatEmploymentType(type: PublicJob["employmentType"]) {
  const labels: Record<NonNullable<PublicJob["employmentType"]>, string> = {
    FULL_TIME: "Tiempo completo",
    PART_TIME: "Medio tiempo",
    CONTRACT: "Contrato",
    TEMPORARY: "Temporal",
    INTERNSHIP: "Pasantia",
    FREELANCE: "Freelance",
  };

  return type ? labels[type] : "No especificado";
}

function formatSalaryRange(min?: number | null, max?: number | null) {
  if (!min && !max) {
    return "A convenir";
  }

  const formatter = new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  return formatter.format(min ?? max ?? 0);
}

function formatOfferCode(job: PublicJob, index: number) {
  const fragment = job.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `OFERTA-${fragment || String(index + 1).padStart(4, "0")}-2026`;
}

function formatPublishedAge(dateValue: string | null) {
  if (!dateValue) {
    return "Fecha pendiente";
  }

  const published = new Date(dateValue);
  const now = new Date();
  const diffInDays = Math.max(
    0,
    Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return diffInDays === 0 ? "Hace 0 dias" : `Hace ${diffInDays} dias`;
}

function getJobLocation(job: PublicJob) {
  return [job.city, job.country].filter(Boolean).join(" - ") || "Ubicacion por definir";
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toComparableDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hasActiveAdvancedFilters(filters: AdvancedJobFilters) {
  return Object.values(filters).some((value) => value.trim().length > 0);
}

type CandidateAdvancedFiltersModalProps = {
  initialFilters: AdvancedJobFilters;
  locations: string[];
  modalities: string[];
  employmentTypes: string[];
  onApply: (filters: AdvancedJobFilters) => void;
  onReset: () => void;
  onClose: () => void;
};

function CandidateAdvancedFiltersModal({
  initialFilters,
  locations,
  modalities,
  employmentTypes,
  onApply,
  onReset,
  onClose,
}: CandidateAdvancedFiltersModalProps) {
  const [draft, setDraft] = useState<AdvancedJobFilters>(initialFilters);

  function updateField<Key extends keyof AdvancedJobFilters>(key: Key, value: AdvancedJobFilters[Key]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Numero de oferta</label>
          <Input
            value={draft.offerCode}
            onChange={(event) => updateField("offerCode", event.target.value)}
            placeholder="OFERTA-0001-2026"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Cargo solicitado</label>
          <Input
            value={draft.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Analista, reclutador, auxiliar..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha publicacion desde</label>
          <Input
            type="date"
            value={draft.publishedFrom}
            onChange={(event) => updateField("publishedFrom", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha publicacion hasta</label>
          <Input
            type="date"
            value={draft.publishedTo}
            onChange={(event) => updateField("publishedTo", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Provincia / ciudad</label>
          <select
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={draft.location}
            onChange={(event) => updateField("location", event.target.value)}
          >
            <option value="">Todas</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Modalidad</label>
          <select
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={draft.modality}
            onChange={(event) => updateField("modality", event.target.value)}
          >
            <option value="">Todas</option>
            {modalities.map((modality) => (
              <option key={modality} value={modality}>
                {modality}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de contrato</label>
          <select
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={draft.employmentType}
            onChange={(event) => updateField("employmentType", event.target.value)}
          >
            <option value="">Todos</option>
            {employmentTypes.map((employmentType) => (
              <option key={employmentType} value={employmentType}>
                {employmentType}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Remuneracion minima</label>
          <Input
            type="number"
            min="0"
            value={draft.minSalary}
            onChange={(event) => updateField("minSalary", event.target.value)}
            placeholder="Ej. 500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Conocimientos o palabras clave del cargo</label>
        <textarea
          className="min-h-28 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          value={draft.requirements}
          onChange={(event) => updateField("requirements", event.target.value)}
          placeholder="Ej. inventarios, seleccion, Excel, conduccion, reclutamiento..."
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setDraft(defaultAdvancedFilters);
            onReset();
            onClose();
          }}
        >
          Limpiar filtros
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}

export function CandidateOpportunitiesClient() {
  const router = useRouter();
  const jobsPerPage = 5;
  const [jobQuery, setJobQuery] = useState("");
  const [jobsPage, setJobsPage] = useState(1);
  const [publicJobs, setPublicJobs] = useState<PublicJob[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [usingDemoJobs, setUsingDemoJobs] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedJobFilters>(defaultAdvancedFilters);
  const { showToast, openModal, closeModal } = useFeedback();

  function openApplyModal(job: PublicJob) {
    openModal({
      title: `Postular a ${job.title}`,
      description: `Empresa: ${job.company.name}`,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta vacante ya puede explorarse con filtros avanzados. El siguiente paso recomendable es completar la postulacion con estudios, experiencia y certificaciones validas para mejorar tu compatibilidad.
          </p>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                closeModal();
                router.push(`/vacantes/${job.slug}`);
              }}
            >
              Abrir proceso de postulacion
            </Button>
          </div>
        </div>
      ),
    });
  }

  function openJobDetailsModal(job: PublicJob, offerCode: string) {
    openModal({
      title: "Oferta laboral",
      description: `${job.company.name} · ${offerCode}`,
      content: (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{job.company.name}</Badge>
            {job.priorityPublication ? <Badge>Prioritaria</Badge> : null}
            <Badge variant="secondary">{offerCode}</Badge>
            <Badge variant="outline">{formatWorkModality(job.modality)}</Badge>
            <Badge variant="outline">{formatEmploymentType(job.employmentType)}</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-semibold text-primary">{job.title}</h4>
            <p className="text-sm text-muted-foreground">
              {getJobLocation(job)} · {formatPublishedAge(job.publishedAt ?? job.createdAt)}
            </p>
            <p className="text-sm font-medium text-foreground">
              Remuneracion: {formatSalaryRange(job.salaryMin, job.salaryMax)}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-primary">Descripcion</p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                {job.description || "La empresa aun no ha agregado una descripcion detallada."}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-primary">Actividades a desempenar</p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                {job.responsibilities || "Actividades por definir por la empresa."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-primary">Perfil del cargo</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Instruccion minima</dt>
                  <dd className="text-right font-medium">
                    {job.requiredEducationLevel || "No especificada"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Experiencia</dt>
                  <dd className="text-right font-medium">
                    {job.minimumYearsExperience && job.minimumYearsExperience > 0
                      ? `${job.minimumYearsExperience} anos`
                      : "No especificada"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Fecha de cierre</dt>
                  <dd className="text-right font-medium">
                    {job.closesAt ? new Date(job.closesAt).toLocaleDateString("es-EC") : "Abierta"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-primary">Requisitos y beneficios</p>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <p className="font-medium">Conocimientos del cargo</p>
                  <p className="mt-1 text-muted-foreground">
                    {job.requirements || "La empresa no especifico conocimientos adicionales."}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Beneficios</p>
                  <p className="mt-1 text-muted-foreground">
                    {job.benefits || "Beneficios no especificados."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-primary">Idiomas requeridos</p>
              {job.requiredLanguages && job.requiredLanguages.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.requiredLanguages.map((language) => (
                    <Badge key={language} variant="outline">
                      {language}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No se requieren idiomas especificos.</p>
              )}
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-sm font-semibold text-primary">Certificaciones requeridas</p>
              {job.requiredCertifications && job.requiredCertifications.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.requiredCertifications.map((certification) => (
                    <Badge key={certification} variant="outline">
                      {certification}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No se requieren certificaciones especificas.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>
              Cerrar
            </Button>
            <Button onClick={() => openApplyModal(job)}>Aplicar</Button>
          </div>
        </div>
      ),
    });
  }

  const filteredJobs = useMemo(() => {
    return publicJobs.filter((job, index) => {
      const normalizedQuery = normalizeText(jobQuery.trim());
      const offerCode = normalizeText(formatOfferCode(job, index));
      const searchableText = normalizeText(
        [
          job.title,
          job.company.name,
          job.city,
          job.country,
          job.description,
          job.requirements,
          job.responsibilities,
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (normalizedQuery && !searchableText.includes(normalizedQuery) && !offerCode.includes(normalizedQuery)) {
        return false;
      }

      if (advancedFilters.offerCode.trim()) {
        const expectedCode = normalizeText(advancedFilters.offerCode.trim());
        if (!offerCode.includes(expectedCode)) {
          return false;
        }
      }

      if (advancedFilters.title.trim()) {
        const expectedTitle = normalizeText(advancedFilters.title.trim());
        if (!normalizeText(job.title).includes(expectedTitle)) {
          return false;
        }
      }

      if (advancedFilters.location.trim()) {
        const expectedLocation = normalizeText(advancedFilters.location.trim());
        const actualLocation = normalizeText(getJobLocation(job));
        if (!actualLocation.includes(expectedLocation)) {
          return false;
        }
      }

      if (advancedFilters.modality.trim()) {
        const expectedModality = normalizeText(advancedFilters.modality.trim());
        if (!normalizeText(formatWorkModality(job.modality)).includes(expectedModality)) {
          return false;
        }
      }

      if (advancedFilters.employmentType.trim()) {
        const expectedEmploymentType = normalizeText(advancedFilters.employmentType.trim());
        if (!normalizeText(formatEmploymentType(job.employmentType)).includes(expectedEmploymentType)) {
          return false;
        }
      }

      if (advancedFilters.minSalary.trim()) {
        const expectedSalary = Number(advancedFilters.minSalary);
        const jobMaxSalary = job.salaryMax ?? job.salaryMin ?? 0;
        if (Number.isFinite(expectedSalary) && jobMaxSalary < expectedSalary) {
          return false;
        }
      }

      if (advancedFilters.requirements.trim()) {
        const expectedRequirements = normalizeText(advancedFilters.requirements.trim());
        const requirementSource = normalizeText(
          [job.requirements, job.responsibilities, job.description].filter(Boolean).join(" "),
        );
        if (!requirementSource.includes(expectedRequirements)) {
          return false;
        }
      }

      const publishedAt = toComparableDate(job.publishedAt ?? job.createdAt);

      if (advancedFilters.publishedFrom && publishedAt) {
        const fromDate = toComparableDate(advancedFilters.publishedFrom);
        if (fromDate && publishedAt < fromDate) {
          return false;
        }
      }

      if (advancedFilters.publishedTo && publishedAt) {
        const toDate = toComparableDate(advancedFilters.publishedTo);
        if (toDate) {
          const inclusiveToDate = new Date(toDate);
          inclusiveToDate.setHours(23, 59, 59, 999);
          if (publishedAt > inclusiveToDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [advancedFilters, jobQuery, publicJobs]);

  const totalJobPages = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));

  const paginatedJobs = useMemo(() => {
    const safePage = Math.min(jobsPage, totalJobPages);
    const start = (safePage - 1) * jobsPerPage;
    return filteredJobs.slice(start, start + jobsPerPage);
  }, [filteredJobs, jobsPage, totalJobPages]);

  const availableLocations = useMemo(
    () => Array.from(new Set(publicJobs.map((job) => getJobLocation(job)).filter(Boolean))),
    [publicJobs],
  );

  const availableModalities = useMemo(
    () =>
      Array.from(
        new Set(
          publicJobs
            .map((job) => formatWorkModality(job.modality))
            .filter((value) => value !== "Por definir"),
        ),
      ),
    [publicJobs],
  );

  const availableEmploymentTypes = useMemo(
    () =>
      Array.from(
        new Set(
          publicJobs
            .map((job) => formatEmploymentType(job.employmentType))
            .filter((value) => value !== "No especificado"),
        ),
      ),
    [publicJobs],
  );

  const loadPublicOffers = useCallback(async (options?: { showSuccessToast?: boolean }) => {
    setIsJobsLoading(true);

    try {
      setJobsError(null);
      const response = await getPublicJobs();

      if (response.length > 0) {
        setPublicJobs(response);
        setUsingDemoJobs(false);
      } else {
        setPublicJobs(fallbackPublicJobs);
        setUsingDemoJobs(true);
      }

      if (options?.showSuccessToast) {
        showToast({
          title: "Ofertas actualizadas",
          description: "La vitrina de vacantes fue recargada correctamente.",
        });
      }
    } catch (error) {
      setJobsError(error instanceof Error ? error.message : "No se pudieron cargar las vacantes.");
      setPublicJobs(fallbackPublicJobs);
      setUsingDemoJobs(true);
      showToast({
        title: "Se cargaron ofertas de demostracion",
        description: "El backend no respondio, asi que se mostraron vacantes de referencia.",
      });
    } finally {
      setIsJobsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPublicOffers();
  }, [loadPublicOffers]);

  useEffect(() => {
    const handleRefresh = () => {
      void loadPublicOffers({ showSuccessToast: true });
    };

    window.addEventListener("candidate-opportunities:refresh", handleRefresh);

    return () => {
      window.removeEventListener("candidate-opportunities:refresh", handleRefresh);
    };
  }, [loadPublicOffers]);

  useEffect(() => {
    setJobsPage(1);
  }, [jobQuery, advancedFilters]);

  useEffect(() => {
    if (jobsPage > totalJobPages) {
      setJobsPage(totalJobPages);
    }
  }, [jobsPage, totalJobPages]);

  function openAdvancedFiltersModal() {
    openModal({
      title: "Busqueda avanzada de ofertas",
      description: "Usa la lupa para combinar filtros por cargo, ubicacion, fechas, remuneracion y palabras clave.",
      content: (
        <CandidateAdvancedFiltersModal
          initialFilters={advancedFilters}
          locations={availableLocations}
          modalities={availableModalities}
          employmentTypes={availableEmploymentTypes}
          onApply={(filters) => {
            setAdvancedFilters(filters);
            showToast({
              title: "Filtros aplicados",
              description: "La lista de ofertas fue actualizada con tu busqueda avanzada.",
            });
          }}
          onReset={() => {
            setAdvancedFilters(defaultAdvancedFilters);
            showToast({
              title: "Filtros limpiados",
              description: "La lista vuelve a mostrar todas las ofertas disponibles.",
            });
          }}
          onClose={closeModal}
        />
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5 shadow-sm">
        <div className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={jobQuery}
              onChange={(event) => setJobQuery(event.target.value)}
              placeholder="Buscar por cargo, empresa, ciudad o palabra clave"
              className="pl-9"
            />
          </div>
          <Button className="min-w-44" variant="outline" onClick={openAdvancedFiltersModal}>
            <Search className="mr-2 size-4" />
            Abrir filtros
          </Button>
        </div>
        {hasActiveAdvancedFilters(advancedFilters) ? (
          <div className="mt-4">
            <Badge variant="outline">Filtros avanzados activos</Badge>
          </div>
        ) : null}
      </div>

      {isJobsLoading ? (
        <DashboardSkeleton />
      ) : jobsError && publicJobs.length === 0 ? (
        <EmptyState
          title="No se pudieron cargar las ofertas"
          description={jobsError}
          icon={<BriefcaseBusiness className="size-6" />}
          action={
            <Button variant="outline" onClick={() => void loadPublicOffers()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl">Vitrina de ofertas</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Listado de vacantes disponibles para tu exploracion y postulacion.
              </p>
            </div>
            <Badge variant="secondary">{filteredJobs.length} resultados</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredJobs.length === 0 ? (
              <EmptyState
                title="No hay ofertas con ese filtro"
                description="Prueba otra combinacion o limpia la busqueda avanzada para ver mas vacantes."
                icon={<Filter className="size-6" />}
                action={
                  <Button
                    onClick={() => {
                      setJobQuery("");
                      setAdvancedFilters(defaultAdvancedFilters);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <>
                {paginatedJobs.map((job) => {
                  const absoluteIndex = filteredJobs.findIndex((item) => item.id === job.id);

                  return (
                    <article
                      key={job.id}
                      className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5 shadow-sm transition hover:border-primary/35"
                    >
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                          {job.company.name}
                        </Badge>
                        {job.priorityPublication ? <Badge>Prioritaria</Badge> : null}
                        <Badge variant="secondary">{formatOfferCode(job, absoluteIndex >= 0 ? absoluteIndex : 0)}</Badge>
                      </div>

                      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-2xl font-semibold text-primary">{job.title}</h4>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              Remuneracion: {formatSalaryRange(job.salaryMin, job.salaryMax)}
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="size-4" />
                              {getJobLocation(job)} - {formatPublishedAge(job.publishedAt ?? job.createdAt)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatWorkModality(job.modality)} - {formatEmploymentType(job.employmentType)}
                            </p>
                          </div>

                          <p className="text-sm leading-6 text-muted-foreground">
                            {job.description || "La empresa aun no ha agregado una descripcion detallada."}
                          </p>
                        </div>

                        <div className="rounded-[1.25rem] border border-border/70 bg-card p-4">
                          <p className="text-sm font-semibold text-primary">Actividades a desempenar</p>
                          <p className="mt-3 text-sm leading-6 text-foreground">
                            {job.responsibilities || job.requirements || "Actividades por definir por la empresa."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Button
                          onClick={() =>
                            openJobDetailsModal(
                              job,
                              formatOfferCode(job, absoluteIndex >= 0 ? absoluteIndex : 0),
                            )
                          }
                        >
                          Ver detalle
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openApplyModal(job)}
                        >
                          Postular
                        </Button>
                      </div>
                    </article>
                  );
                })}

                <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-card/70 p-4 text-sm md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobsPage === 1}
                      onClick={() => setJobsPage(1)}
                    >
                      {"<<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobsPage === 1}
                      onClick={() => setJobsPage((current) => Math.max(1, current - 1))}
                    >
                      {"<"}
                    </Button>
                    <select
                      className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={jobsPage}
                      onChange={(event) => setJobsPage(Number(event.target.value))}
                    >
                      {Array.from({ length: totalJobPages }, (_, index) => index + 1).map((pageNumber) => (
                        <option key={pageNumber} value={pageNumber}>
                          {pageNumber}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobsPage === totalJobPages}
                      onClick={() => setJobsPage((current) => Math.min(totalJobPages, current + 1))}
                    >
                      {">"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobsPage === totalJobPages}
                      onClick={() => setJobsPage(totalJobPages)}
                    >
                      {">>"}
                    </Button>
                  </div>
                  <div className="text-muted-foreground">
                    Total: {filteredJobs.length} registros. Pag. actual: {jobsPage}. Total paginas: {totalJobPages}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
