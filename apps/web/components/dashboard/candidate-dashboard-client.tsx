"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Download,
  FileCheck2,
  FilePlus2,
  Sparkles,
  Trash2,
} from "lucide-react";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardTable } from "@/components/dashboard/dashboard-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteDocument,
  getMyDocuments,
  getSignedDocumentUrl,
  uploadDocument,
  type CandidateDocument,
} from "@/lib/api/documents";
import { getMyApplications, type CandidateApplication } from "@/lib/api/applications";

const documentTypeOptions: Array<{ value: CandidateDocument["type"]; label: string }> = [
  { value: "CV", label: "CV en PDF" },
  { value: "CERTIFICATE", label: "Certificado" },
  { value: "ID", label: "Documento personal" },
  { value: "LICENSE", label: "Licencia" },
  { value: "OTHER", label: "Otro" },
];

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDocumentType(type: CandidateDocument["type"]) {
  const labels: Record<CandidateDocument["type"], string> = {
    CV: "CV",
    CERTIFICATE: "Certificado",
    ID: "Documento personal",
    LICENSE: "Licencia",
    OTHER: "Otro",
  };

  return labels[type];
}

export function CandidateDashboardClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(true);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<CandidateDocument["type"]>("CV");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const { closeModal, showToast, openModal } = useFeedback();

  const filteredApplications = useMemo(
    () => applications,
    [applications],
  );

  const stats = useMemo(
    () => [
      {
        label: "Postulaciones enviadas",
        value: applications.length.toString(),
        helper: "Seguimiento en tiempo real",
      },
      {
        label: "Entrevistas activas",
        value: applications.filter((application) => application.status === "INTERVIEW").length.toString(),
        helper: "Procesos en curso",
      },
      {
        label: "Documentos cargados",
        value: documents.length.toString(),
        helper: "Expediente digital",
      },
    ],
    [applications, documents.length],
  );

  const statIcons = [
    <BriefcaseBusiness key="a" className="size-5" />,
    <Sparkles key="b" className="size-5" />,
    <FileCheck2 key="c" className="size-5" />,
  ];

  const loadDocuments = useCallback(async (options?: { showSuccessToast?: boolean }) => {
    try {
      setDocumentsError(null);
      const response = await getMyDocuments();
      setDocuments(response);

      if (options?.showSuccessToast) {
        showToast({
          title: "Documentos sincronizados",
          description: "El expediente digital fue actualizado desde el backend.",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el expediente digital.";
      setDocumentsError(message);
      showToast({
        title: "Error al cargar documentos",
        description: message,
      });
    } finally {
      setIsDocumentsLoading(false);
    }
  }, [showToast]);

  const loadApplications = useCallback(async (options?: { showSuccessToast?: boolean }) => {
    try {
      setApplicationsError(null);
      const response = await getMyApplications();
      setApplications(response);

      if (options?.showSuccessToast) {
        showToast({
          title: "Postulaciones sincronizadas",
          description: "El panel del candidato fue actualizado desde el backend.",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar las postulaciones.";
      setApplicationsError(message);
      showToast({
        title: "Error al cargar postulaciones",
        description: message,
      });
    } finally {
      setIsApplicationsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadDocuments();
    void loadApplications();
  }, [loadApplications, loadDocuments]);

  const triggerLoading = () => {
    setIsLoading(true);
    Promise.allSettled([
      loadDocuments({ showSuccessToast: false }),
      loadApplications({ showSuccessToast: false }),
    ]).finally(() => {
      setIsLoading(false);
      showToast({
        title: "Panel actualizado",
        description: "La informacion del candidato fue recargada correctamente.",
      });
    });
  };

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      showToast({
        title: "Archivo requerido",
        description: "Selecciona un documento antes de subirlo.",
      });
      return;
    }

    if (
      selectedDocumentType === "CV" &&
      documents.some((document) => document.type === "CV")
    ) {
      showToast({
        title: "CV ya cargado",
        description: "Solo puedes tener una hoja de vida en PDF. Elimina la actual antes de subir otra.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadDocument({
        documentType: selectedDocumentType,
        file: selectedFile,
      });

      setDocuments((current) => [response.document, ...current]);
      setSelectedFile(null);
      const fileInput = document.getElementById("candidate-document-file") as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      showToast({
        title: "Documento cargado",
        description: response.message,
      });
    } catch (error) {
      showToast({
        title: "Carga rechazada",
        description: error instanceof Error ? error.message : "No se pudo subir el documento.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSignedUrl(documentId: string, download = false) {
    setActiveDocumentId(documentId);

    try {
      const response = await getSignedDocumentUrl(documentId, { download });
      window.open(response.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      showToast({
        title: "No se pudo abrir el documento",
        description:
          error instanceof Error ? error.message : "No se pudo generar la URL firmada.",
      });
    } finally {
      setActiveDocumentId(null);
    }
  }

  async function handleDelete(documentId: string) {
    setActiveDocumentId(documentId);

    try {
      const response = await deleteDocument(documentId);
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      closeModal();
      showToast({
        title: "Documento eliminado",
        description: response.message,
      });
    } catch (error) {
      showToast({
        title: "No se pudo eliminar",
        description:
          error instanceof Error ? error.message : "No se pudo eliminar el documento.",
      });
    } finally {
      setActiveDocumentId(null);
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={stat.helper}
            icon={statIcons[index]}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-xl">Subir documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-4" onSubmit={handleUpload}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="candidate-document-type">
                  Tipo de documento
                </label>
                <select
                  id="candidate-document-type"
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={selectedDocumentType}
                  onChange={(event) =>
                    setSelectedDocumentType(event.target.value as CandidateDocument["type"])
                  }
                >
                  {documentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="candidate-document-file">
                  Archivo
                </label>
                <div className="flex flex-col gap-3 rounded-[1.25rem] border border-input bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {selectedFile ? selectedFile.name : "No se ha seleccionado ningun archivo"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Formatos permitidos segun el tipo documental.
                    </p>
                  </div>
                  <label
                    htmlFor="candidate-document-file"
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Elegir archivo
                  </label>
                  <Input
                    id="candidate-document-file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  CV: un solo archivo PDF de hasta 2 MB. Certificados y documentos personales: PDF, PNG o JPG.
                </p>
              </div>

              <Button className="w-full" type="submit" disabled={isUploading}>
                <FilePlus2 className="mr-2 size-4" />
                {isUploading ? "Subiendo..." : "Subir documento"}
              </Button>
            </form>

            <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
              Los archivos se guardan en Supabase Storage. La base solo conserva metadatos y rutas seguras.
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Mis documentos</CardTitle>
            <Button variant="outline" onClick={() => void loadDocuments({ showSuccessToast: true })}>
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            {isDocumentsLoading ? (
              <DashboardSkeleton />
            ) : documentsError ? (
              <EmptyState
                title="No se pudo cargar el expediente"
                description={documentsError}
                icon={<FileCheck2 className="size-6" />}
                action={
                  <Button variant="outline" onClick={() => void loadDocuments()}>
                    Reintentar
                  </Button>
                }
              />
            ) : documents.length === 0 ? (
              <EmptyState
                title="Aun no has cargado documentos"
                description="Sube tu CV, certificados y documentos personales para completar tu perfil."
                icon={<FileCheck2 className="size-6" />}
              />
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-4 rounded-[1.25rem] border border-border/70 bg-background/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">{document.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDocumentType(document.type)} - {document.mimeType} - {formatFileSize(document.size)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeDocumentId === document.id}
                        onClick={() => void handleSignedUrl(document.id, false)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeDocumentId === document.id}
                        onClick={() => void handleSignedUrl(document.id, true)}
                      >
                        <Download className="mr-2 size-4" />
                        Descargar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={activeDocumentId === document.id}
                        onClick={() =>
                          openModal({
                            title: "Eliminar documento",
                            description: `Se eliminara ${document.fileName} del storage privado.`,
                            content: (
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => closeModal()}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => void handleDelete(document.id)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Confirmar eliminacion
                                </Button>
                              </div>
                            ),
                          })
                        }
                      >
                        <Trash2 className="mr-2 size-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.5rem] border-border/60 bg-card/90">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">Postulaciones activas</CardTitle>
            <Badge variant="secondary">{filteredApplications.length} resultados</Badge>
          </CardHeader>
          <CardContent>
            {isApplicationsLoading ? (
              <DashboardSkeleton />
            ) : applicationsError ? (
              <EmptyState
                title="No se pudieron cargar tus postulaciones"
                description={applicationsError}
                icon={<BriefcaseBusiness className="size-6" />}
                action={
                  <Button variant="outline" onClick={() => void loadApplications()}>
                    Reintentar
                  </Button>
                }
              />
            ) : filteredApplications.length === 0 ? (
              <EmptyState
                title={
                  applications.length === 0
                    ? "Aun no has realizado postulaciones"
                    : "No hay postulaciones con ese filtro"
                }
                description={
                  applications.length === 0
                    ? "Cuando postules a una vacante, aqui veras el seguimiento de tu proceso."
                    : "No hay registros disponibles para mostrar en este momento."
                }
                icon={<BriefcaseBusiness className="size-6" />}
              />
            ) : (
              <DashboardTable
                columns={[
                  {
                    key: "vacancy",
                    label: "Vacante",
                    render: (row) => (
                      <div>
                        <p className="font-medium">{row.jobOffer.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {row.jobOffer.company?.name ?? "Empresa no disponible"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: "Estado",
                    render: (row) => <Badge variant="outline">{formatApplicationStatus(row.status)}</Badge>,
                  },
                  {
                    key: "compatibility",
                    label: "Compatibilidad",
                    render: (row) => <span className="font-medium">{row.compatibilityScore}%</span>,
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
                            title: row.jobOffer.title,
                            description: `Timeline y compatibilidad para ${row.jobOffer.company?.name ?? "esta empresa"}.`,
                            content: (
                              <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                  {row.timelineEntries.map((step) => (
                                    <Badge key={step.id} variant="secondary">
                                      {formatApplicationStatus(step.status)}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Compatibilidad calculada: {row.compatibilityScore}%. Puedes reforzar tu hoja de vida con certificaciones y experiencia relevante.
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
            {isApplicationsLoading ? (
              <DashboardSkeleton />
            ) : filteredApplications.length === 0 ? (
              <EmptyState
                title="Sin timeline disponible"
                description="Cuando existan postulaciones activas, aqui veras cada avance de tu proceso."
                icon={<BriefcaseBusiness className="size-6" />}
              />
            ) : (
              filteredApplications.slice(0, 3).map((application) => (
                <div key={application.id} className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
                  <p className="font-medium">{application.jobOffer.title}</p>
                  <div className="mt-4 space-y-3">
                    {application.timelineEntries.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3">
                        <div className="mt-1 flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{formatApplicationStatus(step.status)}</p>
                          <p className="text-sm text-muted-foreground">
                            {step.description ?? "Seguimiento ATS del proceso de seleccion."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
