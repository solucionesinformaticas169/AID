"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Download, Save, Upload } from "lucide-react";

import { useFeedback } from "@/components/providers/feedback-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getMyDocuments,
  getSignedDocumentUrl,
  uploadDocument,
  type CandidateDocument,
} from "@/lib/api/documents";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type ResumeSection = {
  id: string;
  label: string;
  available: boolean;
};

type EducationRecord = {
  id: string;
  level: string;
  institution: string;
  title: string;
  studyArea: string;
  studyTimeValue: string;
  studyTimeUnit: string;
  graduationYear: string;
  senescyt: string;
};

type PersonalInfoFormData = {
  documentNumber: string;
  paternalLastName: string;
  maternalLastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  birthCountry: string;
  gender: string;
  bloodType: string;
  maritalStatus: string;
  employmentStatus: string;
  ethnicity: string;
  ecuadorianCitizen: string;
  onlineInterviews: string;
  residentVisa: string;
  willingToTravel: string;
  driversLicense: string;
  licenseType: string;
  hasVehicle: string;
  vehicleType: string;
  addressCountry: string;
  province: string;
  canton: string;
  parish: string;
  borderResident: string;
  galapagosResident: string;
  galapagosResidenceType: string;
  mainStreet: string;
  number: string;
  secondaryStreet: string;
  sector: string;
  reference: string;
  homePhone: string;
  familyPhone: string;
  workPhone: string;
  mobilePhone: string;
  email1: string;
  email2: string;
  hasDisability: string;
  conadisNumber: string;
  disabilityType: string;
  disabilityPercentage: string;
};

type EducationFormData = {
  educationLevel: string;
  institutionType: string;
  studyArea: string;
  studyTimeValue: string;
  studyTimeUnit: string;
  graduationYear: string;
  senescytNumber: string;
};

type LanguageRecord = {
  id: string;
  language: string;
  spokenLevel: string;
  writtenLevel: string;
};

type LanguageFormData = {
  language: string;
  spokenLevel: string;
  writtenLevel: string;
};

type TrainingRecord = {
  id: string;
  institution: string;
  eventType: string;
  eventName: string;
  studyArea: string;
  certificationType: string;
  startDate: string;
  endDate: string;
  totalDays: string;
  totalHours: string;
};

type TrainingFormData = {
  institution: string;
  eventType: string;
  eventName: string;
  studyArea: string;
  certificationType: string;
  startDate: string;
  endDate: string;
  totalDays: string;
  totalHours: string;
};

type ExperienceRecord = {
  id: string;
  company: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  currentlyWorking: string;
  city: string;
  contractType: string;
  workday: string;
  responsibilities: string;
  achievements: string;
  exitReason: string;
};

type ExperienceFormData = {
  company: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  currentlyWorking: string;
  city: string;
  contractType: string;
  workday: string;
  responsibilities: string;
  achievements: string;
  exitReason: string;
};

type PersonalReferenceRecord = {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  city: string;
};

type PersonalReferenceFormData = {
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  city: string;
};

type CandidateProfileResponse = {
  profile: {
    city?: string | null;
    country?: string | null;
    birthDate?: string | null;
    personalInfo?: Partial<PersonalInfoFormData> | null;
    profileCompletion?: number;
  } | null;
};

type CandidateEducationResponse = EducationRecord[];
type CandidateExperienceResponse = ExperienceRecord[];
type CandidateLanguageResponse = LanguageRecord[];
type CandidateTrainingResponse = TrainingRecord[];
type CandidateReferenceResponse = PersonalReferenceRecord[];
type CandidateResumeResponse = {
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    birthDate?: string | null;
    personalInfo?: Partial<PersonalInfoFormData> | null;
    profileCompletion?: number;
  } | null;
  educationRecords: EducationRecord[];
  languageRecords: LanguageRecord[];
  trainingRecords: TrainingRecord[];
  experienceRecords: ExperienceRecord[];
  referenceRecords: PersonalReferenceRecord[];
};

const MAX_CV_UPLOAD_MB = 2;

const resumeSections: ResumeSection[] = [
  { id: "informacion-personal", label: "Informacion personal", available: true },
  { id: "instruccion-formal", label: "Instruccion formal", available: true },
  { id: "idiomas", label: "Idiomas", available: true },
  { id: "capacitaciones", label: "Capacitaciones / Certificaciones", available: true },
  { id: "experiencia", label: "Experiencia", available: true },
  { id: "referencias", label: "Referencias personales", available: true },
];

const educationLevelOptions = [
  "Seleccione",
  "Sin instruccion",
  "Primaria / basica elemental / basica media",
  "Educacion basica / basica superior",
  "Bachiller",
  "Secundaria sin finalizar",
  "Certificado de culminacion de educacion superior",
  "Egresado",
  "Estudiante universitario / educacion superior (desde tercer ano aprobado - 6to semestre aprobado)",
  "Estudiante universitario / educacion superior (desde un dia hasta tercer ano en curso o 6to semestre en curso)",
  "Tecnico superior",
  "Tecnologico superior",
  "Tercer nivel",
  "Cuarto nivel - diplomado",
  "Cuarto nivel - especialidad",
  "Cuarto nivel - maestria",
  "Cuarto nivel especializacion tecnica",
  "Cuarto nivel especializacion tecnologica",
  "Cuarto nivel maestria tecnica",
  "Cuarto nivel maestria tecnologica",
  "Cuarto nivel maestria o doctorado",
  "PhD - doctorado",
];

const educationalInstitutionOptions = [
  "Seleccione",
  "Universidad de Cuenca",
  "Universidad Catolica de Cuenca",
  "Universidad Politecnica Salesiana - Cuenca",
  "Universidad del Azuay",
  "Universidad Nacional de Educacion (UNAE)",
  "Instituto Superior Tecnologico del Azuay",
  "Instituto Superior Tecnologico Sudamericano",
  "Instituto Superior Tecnologico American College",
  "Instituto Superior Tecnologico Particular Alianza",
  "Instituto Superior Tecnologico San Isidro",
  "Otro",
];

const studyAreaOptions = [
  "Administracion/oficina",
  "Contabilidad y auditoria",
  "Informatica / sistemas",
  "Talento humano",
  "Educacion",
  "Salud",
  "Ingenieria",
  "Comercial / ventas",
  "Otra",
];

const languageOptions = [
  "Seleccione",
  "Achuar",
  "Aleman",
  "Arabe",
  "Chino (mandarin)",
  "Espanol",
  "Frances",
  "Ingles",
  "Italiano",
  "Kichwa",
  "Portugues",
  "Shuar",
  "Otro",
];

const languageLevelOptions = ["Seleccione", "Basico", "Intermedio", "Avanzado", "Nativo"];

const trainingEventTypeOptions = [
  "Seleccione",
  "Curso",
  "Seminario",
  "Taller",
  "Congreso",
  "Diplomado",
  "Certificacion",
  "Webinar",
  "Otro",
];

const certificationTypeOptions = [
  "Seleccione",
  "Aprobacion",
  "Asistencia",
  "Participacion",
  "Certificacion",
  "Diploma",
  "Otro",
];

const initialEducationRecords: EducationRecord[] = [];
const initialLanguageRecords: LanguageRecord[] = [];
const initialTrainingRecords: TrainingRecord[] = [];
const initialExperienceRecords: ExperienceRecord[] = [];
const initialReferenceRecords: PersonalReferenceRecord[] = [];

const defaultFormData: PersonalInfoFormData = {
  documentNumber: "",
  paternalLastName: "",
  maternalLastName: "",
  firstName: "",
  middleName: "",
  birthDate: "",
  birthCountry: "Ecuador",
  gender: "Masculino",
  bloodType: "O+",
  maritalStatus: "Soltero/a",
  employmentStatus: "Desempleado",
  ethnicity: "Mestizo/a",
  ecuadorianCitizen: "SI",
  onlineInterviews: "SI",
  residentVisa: "NO",
  willingToTravel: "SI",
  driversLicense: "NO",
  licenseType: "B",
  hasVehicle: "NO",
  vehicleType: "Automovil",
  addressCountry: "Ecuador",
  province: "",
  canton: "",
  parish: "",
  borderResident: "NO",
  galapagosResident: "NO",
  galapagosResidenceType: "",
  mainStreet: "",
  number: "",
  secondaryStreet: "",
  sector: "",
  reference: "",
  homePhone: "",
  familyPhone: "",
  workPhone: "",
  mobilePhone: "",
  email1: "",
  email2: "",
  hasDisability: "NO",
  conadisNumber: "",
  disabilityType: "Fisica",
  disabilityPercentage: "",
};

const defaultEducationFormData: EducationFormData = {
  educationLevel: "Seleccione",
  institutionType: "Seleccione",
  studyArea: "Administracion/oficina",
  studyTimeValue: "1",
  studyTimeUnit: "Ano",
  graduationYear: "1900",
  senescytNumber: "",
};

const defaultLanguageFormData: LanguageFormData = {
  language: "Seleccione",
  spokenLevel: "Seleccione",
  writtenLevel: "Seleccione",
};

const defaultTrainingFormData: TrainingFormData = {
  institution: "",
  eventType: "Seleccione",
  eventName: "",
  studyArea: "Administracion/oficina",
  certificationType: "Seleccione",
  startDate: "",
  endDate: "",
  totalDays: "",
  totalHours: "",
};

const defaultExperienceFormData: ExperienceFormData = {
  company: "",
  position: "",
  department: "",
  startDate: "",
  endDate: "",
  currentlyWorking: "NO",
  city: "",
  contractType: "Seleccione",
  workday: "Seleccione",
  responsibilities: "",
  achievements: "",
  exitReason: "",
};

const defaultReferenceFormData: PersonalReferenceFormData = {
  fullName: "",
  relationship: "Referencia personal",
  phone: "",
  email: "",
  city: "",
};

function createEducationFormData(educationLevel = "Seleccione"): EducationFormData {
  return {
    ...defaultEducationFormData,
    educationLevel,
  };
}

function calculateAge(birthDate: string) {
  if (!birthDate) {
    return "";
  }

  const birth = new Date(birthDate);

  if (Number.isNaN(birth.getTime())) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
}

function formatDateLabel(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-EC");
}

function sanitizeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function BinaryChoice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-3">
        {["SI", "NO"].map((option) => {
          const active = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/70 bg-background text-foreground hover:bg-accent/50",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full border",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 text-transparent",
                )}
              >
                <Check className="size-3" />
              </span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CandidateResumeClient({ user }: { user: SessionUser | null }) {
  const [activeSection, setActiveSection] = useState(resumeSections[0].id);
  const [form, setForm] = useState<PersonalInfoFormData>(defaultFormData);
  const [educationForm, setEducationForm] = useState<EducationFormData>(defaultEducationFormData);
  const [languageForm, setLanguageForm] = useState<LanguageFormData>(defaultLanguageFormData);
  const [trainingForm, setTrainingForm] = useState<TrainingFormData>(defaultTrainingFormData);
  const [experienceForm, setExperienceForm] = useState<ExperienceFormData>(defaultExperienceFormData);
  const [referenceForm, setReferenceForm] = useState<PersonalReferenceFormData>(defaultReferenceFormData);
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>(initialEducationRecords);
  const [languageRecords, setLanguageRecords] = useState<LanguageRecord[]>(initialLanguageRecords);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(initialTrainingRecords);
  const [experienceRecords, setExperienceRecords] = useState<ExperienceRecord[]>(initialExperienceRecords);
  const [referenceRecords, setReferenceRecords] = useState<PersonalReferenceRecord[]>(initialReferenceRecords);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [editingLanguageId, setEditingLanguageId] = useState<string | null>(null);
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editingReferenceId, setEditingReferenceId] = useState<string | null>(null);
  const [showNewTrainingForm, setShowNewTrainingForm] = useState(false);
  const [showNewExperienceForm, setShowNewExperienceForm] = useState(false);
  const [showNewReferenceForm, setShowNewReferenceForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [persistedResumeCompletion, setPersistedResumeCompletion] = useState<number | null>(null);
  const { showToast } = useFeedback();

  const syncPersistedResumeCompletion = useCallback(async () => {
    const response = await fetch("/api/candidate/profile", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("No se pudo sincronizar el porcentaje de la hoja de vida.");
    }

    const payload = (await response.json()) as CandidateProfileResponse;
    setPersistedResumeCompletion(payload.profile?.profileCompletion ?? 0);
  }, []);

  const cvDocument = useMemo(
    () =>
      [...documents]
        .filter((document) => document.type === "CV")
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null,
    [documents],
  );

  const personalRequiredFields = useMemo(
    () => [
      form.documentNumber,
      form.paternalLastName,
      form.firstName,
      form.birthDate,
      form.birthCountry,
      form.gender,
      form.maritalStatus,
      form.addressCountry,
      form.province,
      form.canton,
      form.mainStreet,
      form.mobilePhone,
      form.email1,
    ],
    [form],
  );

  const personalInfoCompletion = useMemo(() => {
    const completed = personalRequiredFields.filter((value) => value.trim().length > 0).length;
    return Math.round((completed / personalRequiredFields.length) * 40);
  }, [personalRequiredFields]);

  const calculatedResumeCompletion = useMemo(() => {
    let score = personalInfoCompletion;
    if (educationRecords.length > 0) score += 10;
    if (languageRecords.length > 0) score += 10;
    if (trainingRecords.length > 0) score += 10;
    if (experienceRecords.length > 0) score += 10;
    if (referenceRecords.length > 0) score += 10;
    if (cvDocument) score += 10;

    return Math.min(score, 100);
  }, [
    cvDocument,
    educationRecords.length,
    experienceRecords.length,
    languageRecords.length,
    personalInfoCompletion,
    referenceRecords.length,
    trainingRecords.length,
  ]);

  const resumeCompletion = useMemo(() => {
    if (persistedResumeCompletion !== null) {
      return persistedResumeCompletion;
    }

    return calculatedResumeCompletion;
  }, [calculatedResumeCompletion, persistedResumeCompletion]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/candidate/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar la informacion personal.");
        }

        const payload = (await response.json()) as CandidateProfileResponse;

        if (!active) {
          return;
        }

        setPersistedResumeCompletion(payload.profile?.profileCompletion ?? 0);

        if (!payload.profile) {
          return;
        }

        const personalInfo = payload.profile.personalInfo ?? {};

        setForm((current) => ({
          ...current,
          ...personalInfo,
          birthDate: personalInfo.birthDate ?? payload.profile?.birthDate ?? current.birthDate,
          addressCountry: personalInfo.addressCountry ?? payload.profile?.country ?? current.addressCountry,
          birthCountry: personalInfo.birthCountry ?? payload.profile?.country ?? current.birthCountry,
          canton: personalInfo.canton ?? payload.profile?.city ?? current.canton,
        }));
      } catch {
        if (!active) {
          return;
        }

        showToast({
          title: "Perfil local",
          description: "Seguimos en modo local para informacion personal hasta completar la conexion.",
        });
      } finally {
        if (active) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    let active = true;

    const loadReferences = async () => {
      try {
        const response = await fetch("/api/candidate/references", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las referencias.");
        }

        const payload = (await response.json()) as CandidateReferenceResponse;

        if (active) {
          setReferenceRecords(payload);
        }
      } catch {
        if (active) {
          showToast({
            title: "Referencias local",
            description: "Seguimos en modo local para referencias hasta completar la sincronizacion.",
          });
        }
      }
    };

    void loadReferences();

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    let active = true;

    const loadTrainings = async () => {
      try {
        const response = await fetch("/api/candidate/trainings", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las capacitaciones.");
        }

        const payload = (await response.json()) as CandidateTrainingResponse;

        if (active) {
          setTrainingRecords(payload);
        }
      } catch {
        if (active) {
          showToast({
            title: "Capacitaciones local",
            description: "Seguimos en modo local para capacitaciones hasta completar la sincronizacion.",
          });
        }
      }
    };

    void loadTrainings();

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    let active = true;

    const loadLanguages = async () => {
      try {
        const response = await fetch("/api/candidate/languages", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar los idiomas.");
        }

        const payload = (await response.json()) as CandidateLanguageResponse;

        if (active) {
          setLanguageRecords(payload);
        }
      } catch {
        if (active) {
          showToast({
            title: "Idiomas local",
            description: "Seguimos en modo local para idiomas hasta completar la sincronizacion.",
          });
        }
      }
    };

    void loadLanguages();

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    let active = true;

    const loadExperience = async () => {
      try {
        const response = await fetch("/api/candidate/experience", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar la experiencia.");
        }

        const payload = (await response.json()) as CandidateExperienceResponse;

        if (active) {
          setExperienceRecords(payload);
        }
      } catch {
        if (active) {
          showToast({
            title: "Experiencia local",
            description: "Seguimos en modo local para experiencia hasta completar la sincronizacion.",
          });
        }
      }
    };

    void loadExperience();

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    let active = true;

    const loadEducation = async () => {
      try {
        const response = await fetch("/api/candidate/education", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar la instruccion formal.");
        }

        const payload = (await response.json()) as CandidateEducationResponse;

        if (active) {
          setEducationRecords(payload);
        }
      } catch {
        if (active) {
          showToast({
            title: "Instruccion local",
            description: "Seguimos en modo local para instruccion formal hasta completar la sincronizacion.",
          });
        }
      }
    };

    void loadEducation();

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    let active = true;

    const loadDocuments = async () => {
      try {
        const response = await getMyDocuments();

        if (active) {
          setDocuments(response);
        }
      } catch {
        if (active) {
          showToast({
            title: "CV pendiente",
            description: "Aun no se pudo sincronizar tu hoja de vida PDF desde documentos.",
          });
        }
      }
    };

    void loadDocuments();

    return () => {
      active = false;
    };
  }, [showToast]);

  const updateField = <K extends keyof PersonalInfoFormData>(key: K, value: PersonalInfoFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSectionClick = (section: ResumeSection) => {
    if (!section.available) {
      showToast({
        title: "Modulo en preparacion",
        description: `Despues desarrollaremos ${section.label.toLowerCase()}.`,
      });
      return;
    }

    if (section.id === "instruccion-formal") {
      setEditingEducationId(null);
      setEducationForm(createEducationFormData());
    }

    if (section.id === "capacitaciones") {
      setEditingTrainingId(null);
      setShowNewTrainingForm(false);
      setTrainingForm(defaultTrainingFormData);
    }

    if (section.id === "experiencia") {
      setEditingExperienceId(null);
      setShowNewExperienceForm(false);
      setExperienceForm(defaultExperienceFormData);
    }

    if (section.id === "referencias") {
      setEditingReferenceId(null);
      setShowNewReferenceForm(false);
      setReferenceForm(defaultReferenceFormData);
    }

    setActiveSection(section.id);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/candidate/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: form.canton,
          country: form.addressCountry,
          personalInfo: form,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
        const message = Array.isArray(payload?.message)
          ? payload.message.join(". ")
          : payload?.message || "No se pudo guardar la informacion personal.";
        throw new Error(message);
      }

      showToast({
        title: "Informacion guardada",
        description: "La informacion personal ya quedo guardada en tu perfil del candidato.",
      });
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar la informacion personal.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleEducationSave = async () => {
    setIsSaving(true);

    try {
      const payload = {
        level: educationForm.educationLevel,
        institution: educationForm.institutionType,
        degree: educationForm.studyArea,
        fieldOfStudy: educationForm.studyArea,
        studyTimeValue: educationForm.studyTimeValue,
        studyTimeUnit: educationForm.studyTimeUnit,
        graduationYear: Number(educationForm.graduationYear),
        senescytNumber: educationForm.senescytNumber,
      };

      const response = await fetch(
        editingEducationId
          ? `/api/candidate/education/${editingEducationId}`
          : "/api/candidate/education",
        {
          method: editingEducationId ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
        const message = Array.isArray(errorPayload?.message)
          ? errorPayload.message.join(". ")
          : errorPayload?.message || "No se pudo guardar la instruccion formal.";
        throw new Error(message);
      }

      const savedRecord = (await response.json()) as EducationRecord;

      setEducationRecords((current) =>
        editingEducationId
          ? current.map((record) => (record.id === editingEducationId ? savedRecord : record))
          : [savedRecord, ...current],
      );

      showToast({
        title: editingEducationId ? "Instruccion actualizada" : "Instruccion guardada",
        description: editingEducationId
          ? "El detalle editado quedo guardado en tu perfil."
          : "El nuevo detalle de instruccion formal fue agregado a tu perfil.",
      });
      setEditingEducationId(null);
      setEducationForm(createEducationFormData());
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar la instruccion formal.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleEducationLevelSelect = (educationLevel: string) => {
    setEditingEducationId(null);
    setEducationForm(createEducationFormData(educationLevel));
  };

  const handleEducationEdit = (record: EducationRecord) => {
    setEditingEducationId(record.id);
    setEducationForm({
      ...createEducationFormData(record.level),
      institutionType: record.institution,
      studyArea: record.studyArea || record.title,
      studyTimeValue: record.studyTimeValue || defaultEducationFormData.studyTimeValue,
      studyTimeUnit: record.studyTimeUnit || defaultEducationFormData.studyTimeUnit,
      graduationYear: record.graduationYear || defaultEducationFormData.graduationYear,
      senescytNumber: record.senescyt,
    });
  };

  const handleEducationCancel = () => {
    setEditingEducationId(null);
    setEducationForm(createEducationFormData());
  };

  const handleLanguageSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/candidate/languages", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(languageForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo guardar el idioma.");
      }

      const nextRecord = (await response.json()) as LanguageRecord;

      setLanguageRecords((current) => [nextRecord, ...current]);

      showToast({
        title: "Idioma guardado",
        description: "El idioma fue agregado a tu hoja de vida.",
      });
      setLanguageForm(defaultLanguageFormData);
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar el idioma.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleLanguageUpdate = async () => {
    if (!editingLanguageId) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/candidate/languages/${editingLanguageId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(languageForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo actualizar el idioma.");
      }

      const updatedRecord = (await response.json()) as LanguageRecord;

      setLanguageRecords((current) =>
        current.map((record) =>
          record.id === editingLanguageId ? updatedRecord : record,
        ),
      );

      showToast({
        title: "Idioma actualizado",
        description: "El idioma editado quedo actualizado en tu hoja de vida.",
      });
      setEditingLanguageId(null);
      setLanguageForm(defaultLanguageFormData);
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo actualizar",
        description: error instanceof Error ? error.message : "No se pudo actualizar el idioma.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleLanguageEdit = (record: LanguageRecord) => {
    setEditingLanguageId(record.id);
    setLanguageForm({
      language: record.language,
      spokenLevel: record.spokenLevel,
      writtenLevel: record.writtenLevel,
    });
  };

  const handleLanguageCancel = () => {
    setEditingLanguageId(null);
    setLanguageForm(defaultLanguageFormData);
  };

  const handleTrainingSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/candidate/trainings", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trainingForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo guardar la capacitacion.");
      }

      const nextRecord = (await response.json()) as TrainingRecord;

      setTrainingRecords((current) => [nextRecord, ...current]);

      showToast({
        title: "Capacitacion guardada",
        description: "La capacitacion fue agregada a tu hoja de vida.",
      });
      setShowNewTrainingForm(false);
      setTrainingForm(defaultTrainingFormData);
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar la capacitacion.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleTrainingUpdate = async () => {
    if (!editingTrainingId) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/candidate/trainings/${editingTrainingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trainingForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo actualizar la capacitacion.");
      }

      const updatedRecord = (await response.json()) as TrainingRecord;

      setTrainingRecords((current) =>
        current.map((record) =>
          record.id === editingTrainingId ? updatedRecord : record,
        ),
      );

      showToast({
        title: "Capacitacion actualizada",
        description: "La capacitacion editada quedo actualizada en tu hoja de vida.",
      });
      setEditingTrainingId(null);
      setShowNewTrainingForm(false);
      setTrainingForm(defaultTrainingFormData);
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo actualizar",
        description: error instanceof Error ? error.message : "No se pudo actualizar la capacitacion.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleNewTraining = () => {
    setEditingTrainingId(null);
    setTrainingForm(defaultTrainingFormData);
    setShowNewTrainingForm(true);
  };

  const handleTrainingEdit = (record: TrainingRecord) => {
    setShowNewTrainingForm(false);
    setEditingTrainingId(record.id);
    setTrainingForm({
      institution: record.institution,
      eventType: record.eventType,
      eventName: record.eventName,
      studyArea: record.studyArea,
      certificationType: record.certificationType,
      startDate: record.startDate,
      endDate: record.endDate,
      totalDays: record.totalDays,
      totalHours: record.totalHours,
    });
  };

  const handleTrainingCancel = () => {
    setEditingTrainingId(null);
    setShowNewTrainingForm(false);
    setTrainingForm(defaultTrainingFormData);
  };

  const handleExperienceSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/candidate/experience", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(experienceForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo guardar la experiencia.");
      }

      const nextRecord = (await response.json()) as ExperienceRecord;

      setExperienceRecords((current) => [nextRecord, ...current]);

      showToast({
        title: "Experiencia guardada",
        description: "La experiencia fue agregada a tu hoja de vida.",
      });
      setShowNewExperienceForm(false);
      setExperienceForm(defaultExperienceFormData);
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo guardar",
        description:
          error instanceof Error ? error.message : "Ocurrio un problema al guardar la experiencia.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleExperienceUpdate = async () => {
    if (!editingExperienceId) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/candidate/experience/${editingExperienceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(experienceForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo actualizar la experiencia.");
      }

      const updatedRecord = (await response.json()) as ExperienceRecord;

      setExperienceRecords((current) =>
        current.map((record) =>
          record.id === editingExperienceId ? updatedRecord : record,
        ),
      );

      showToast({
        title: "Experiencia actualizada",
        description: "La experiencia editada quedo actualizada en tu hoja de vida.",
      });
      setEditingExperienceId(null);
      setExperienceForm(defaultExperienceFormData);
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo actualizar",
        description:
          error instanceof Error ? error.message : "Ocurrio un problema al actualizar la experiencia.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleNewExperience = () => {
    setEditingExperienceId(null);
    setExperienceForm(defaultExperienceFormData);
    setShowNewExperienceForm(true);
  };

  const handleExperienceEdit = (record: ExperienceRecord) => {
    setShowNewExperienceForm(false);
    setEditingExperienceId(record.id);
    setExperienceForm({
      company: record.company,
      position: record.position,
      department: record.department,
      startDate: record.startDate,
      endDate: record.endDate,
      currentlyWorking: record.currentlyWorking,
      city: record.city,
      contractType: record.contractType,
      workday: record.workday,
      responsibilities: record.responsibilities,
      achievements: record.achievements,
      exitReason: record.exitReason,
    });
  };

  const handleExperienceCancel = () => {
    setEditingExperienceId(null);
    setShowNewExperienceForm(false);
    setExperienceForm(defaultExperienceFormData);
  };

  const handleReferenceSave = async () => {
    if (referenceRecords.length >= 3) {
      showToast({
        title: "Maximo alcanzado",
        description: "Solo puedes registrar hasta 3 referencias personales.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/candidate/references", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(referenceForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo guardar la referencia.");
      }

      const nextRecord = (await response.json()) as PersonalReferenceRecord;

      setReferenceRecords((current) => [nextRecord, ...current]);

      showToast({
        title: "Referencia guardada",
        description: "La referencia personal fue agregada a tu hoja de vida.",
      });
      setShowNewReferenceForm(false);
      setReferenceForm(defaultReferenceFormData);
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "No se pudo guardar la referencia.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleReferenceUpdate = async () => {
    if (!editingReferenceId) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/candidate/references/${editingReferenceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(referenceForm),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo actualizar la referencia.");
      }

      const updatedRecord = (await response.json()) as PersonalReferenceRecord;

      setReferenceRecords((current) =>
        current.map((record) =>
          record.id === editingReferenceId ? updatedRecord : record,
        ),
      );

      showToast({
        title: "Referencia actualizada",
        description: "La referencia personal editada quedo actualizada en tu hoja de vida.",
      });
      setEditingReferenceId(null);
      setReferenceForm(defaultReferenceFormData);
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo actualizar",
        description: error instanceof Error ? error.message : "No se pudo actualizar la referencia.",
      });
    } finally {
      window.setTimeout(() => setIsSaving(false), 400);
    }
  };

  const handleNewReference = () => {
    if (referenceRecords.length >= 3) {
      showToast({
        title: "Maximo alcanzado",
        description: "Solo puedes registrar hasta 3 referencias personales.",
      });
      return;
    }

    setEditingReferenceId(null);
    setReferenceForm(defaultReferenceFormData);
    setShowNewReferenceForm(true);
  };

  const handleReferenceEdit = (record: PersonalReferenceRecord) => {
    setShowNewReferenceForm(false);
    setEditingReferenceId(record.id);
    setReferenceForm({
      fullName: record.fullName,
      relationship: record.relationship,
      phone: record.phone,
      email: record.email,
      city: record.city,
    });
  };

  const handleReferenceCancel = () => {
    setEditingReferenceId(null);
    setShowNewReferenceForm(false);
    setReferenceForm(defaultReferenceFormData);
  };

  const handleCvUpload = async () => {
    if (!selectedCvFile) {
      showToast({
        title: "Archivo requerido",
        description: "Selecciona tu hoja de vida en PDF antes de subirla.",
      });
      return;
    }

    if (cvDocument) {
      showToast({
        title: "CV ya cargado",
        description: "Solo puedes tener una hoja de vida en PDF. Elimina la actual antes de subir una nueva.",
      });
      return;
    }

    if (selectedCvFile.type !== "application/pdf") {
      showToast({
        title: "Formato no permitido",
        description: "La hoja de vida propia debe cargarse solo en formato PDF.",
      });
      return;
    }

    if (selectedCvFile.size > MAX_CV_UPLOAD_MB * 1024 * 1024) {
      showToast({
        title: "Archivo demasiado grande",
        description: `Para CV recomiendo y validamos un maximo de ${MAX_CV_UPLOAD_MB} MB.`,
      });
      return;
    }

    setIsUploadingCv(true);

    try {
      const response = await uploadDocument({
        documentType: "CV",
        file: selectedCvFile,
      });

      setDocuments((current) => [
        response.document,
        ...current.filter((document) => document.id !== response.document.id),
      ]);
      setSelectedCvFile(null);

      const fileInput = document.getElementById("resume-cv-file") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }

      showToast({
        title: "CV cargado",
        description: "Tu hoja de vida propia ya forma parte de tu perfil.",
      });
      await syncPersistedResumeCompletion();
    } catch (error) {
      showToast({
        title: "No se pudo cargar el CV",
        description: error instanceof Error ? error.message : "No se pudo subir tu hoja de vida.",
      });
    } finally {
      setIsUploadingCv(false);
    }
  };

  const handleOpenCv = async (download = false) => {
    if (!cvDocument) {
      return;
    }

    setActiveDocumentId(cvDocument.id);

    try {
      const response = await getSignedDocumentUrl(cvDocument.id, { download });
      window.open(response.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      showToast({
        title: "No se pudo abrir el CV",
        description: error instanceof Error ? error.message : "No se pudo generar el acceso al CV.",
      });
    } finally {
      setActiveDocumentId(null);
    }
  };

  const handleDownloadResumePdf = async () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=980,height=1200");

    if (!printWindow) {
      showToast({
        title: "Ventana bloqueada",
        description: "Permite ventanas emergentes para descargar la hoja de vida en PDF.",
      });
      return;
    }

    try {
      const response = await fetch("/api/candidate/resume", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo cargar la hoja de vida persistida.");
      }

      const resume = (await response.json()) as CandidateResumeResponse;
      const personalInfo = resume.profile?.personalInfo ?? {};
      const fullName = `${personalInfo.firstName ?? resume.profile?.firstName ?? ""} ${personalInfo.middleName ?? ""} ${personalInfo.paternalLastName ?? ""} ${personalInfo.maternalLastName ?? resume.profile?.lastName ?? ""}`
        .replace(/\s+/g, " ")
        .trim();

      const html = `
        <html>
          <head>
            <title>Hoja de vida - ${sanitizeHtml(fullName || resume.profile?.email || user?.email || "Candidato")}</title>
            <style>
              body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
              h1, h2 { margin: 0 0 12px; }
              h1 { font-size: 28px; }
              h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
              p { font-size: 13px; line-height: 1.5; }
              .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
              .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
              th { background: #f8fafc; }
            </style>
          </head>
          <body>
            <h1>${sanitizeHtml(fullName || "Hoja de vida")}</h1>
            <p>${sanitizeHtml(String(personalInfo.email1 ?? resume.profile?.email ?? user?.email ?? ""))}${personalInfo.mobilePhone ? ` | ${sanitizeHtml(String(personalInfo.mobilePhone))}` : ""}</p>
            <div class="meta">
              <div class="card"><strong>Documento:</strong> ${sanitizeHtml(String(personalInfo.documentNumber ?? "-"))}</div>
              <div class="card"><strong>Ubicacion:</strong> ${sanitizeHtml([personalInfo.canton, personalInfo.province, personalInfo.addressCountry].filter(Boolean).join(", ") || "-")}</div>
              <div class="card"><strong>Genero:</strong> ${sanitizeHtml(String(personalInfo.gender ?? "-"))}</div>
              <div class="card"><strong>Fecha de nacimiento:</strong> ${sanitizeHtml(formatDateLabel(String(personalInfo.birthDate ?? resume.profile?.birthDate ?? "")))}</div>
            </div>
            <h2>Informacion personal</h2>
            <p>${sanitizeHtml(String(personalInfo.mainStreet ?? "-"))} ${sanitizeHtml(String(personalInfo.number ?? ""))}, ${sanitizeHtml(String(personalInfo.secondaryStreet ?? ""))}. Sector: ${sanitizeHtml(String(personalInfo.sector ?? "-"))}.</p>
            <p>Disponibilidad para viajar: ${sanitizeHtml(String(personalInfo.willingToTravel ?? "-"))}. Entrevistas en linea: ${sanitizeHtml(String(personalInfo.onlineInterviews ?? "-"))}. Licencia: ${sanitizeHtml(String(personalInfo.driversLicense ?? "-"))} ${personalInfo.driversLicense === "SI" ? `(${sanitizeHtml(String(personalInfo.licenseType ?? ""))})` : ""}.</p>
            <h2>Instruccion formal</h2>
            ${
              resume.educationRecords.length > 0
                ? `<table><thead><tr><th>Nivel</th><th>Institucion</th><th>Titulo / Area</th><th>SENESCYT</th></tr></thead><tbody>${resume.educationRecords
                    .map(
                      (record) =>
                        `<tr><td>${sanitizeHtml(record.level)}</td><td>${sanitizeHtml(record.institution)}</td><td>${sanitizeHtml(record.title)}</td><td>${sanitizeHtml(record.senescyt || "-")}</td></tr>`,
                    )
                    .join("")}</tbody></table>`
                : "<p>Sin registros.</p>"
            }
            <h2>Idiomas</h2>
            ${
              resume.languageRecords.length > 0
                ? `<table><thead><tr><th>Idioma</th><th>Nivel hablado</th><th>Nivel escrito</th></tr></thead><tbody>${resume.languageRecords
                    .map(
                      (record) =>
                        `<tr><td>${sanitizeHtml(record.language)}</td><td>${sanitizeHtml(record.spokenLevel)}</td><td>${sanitizeHtml(record.writtenLevel)}</td></tr>`,
                    )
                    .join("")}</tbody></table>`
                : "<p>Sin registros.</p>"
            }
            <h2>Capacitaciones / Certificaciones</h2>
            ${
              resume.trainingRecords.length > 0
                ? `<table><thead><tr><th>Institucion</th><th>Evento</th><th>Area</th><th>Certificado</th><th>Horas</th></tr></thead><tbody>${resume.trainingRecords
                    .map(
                      (record) =>
                        `<tr><td>${sanitizeHtml(record.institution)}</td><td>${sanitizeHtml(record.eventName)}</td><td>${sanitizeHtml(record.studyArea)}</td><td>${sanitizeHtml(record.certificationType)}</td><td>${sanitizeHtml(record.totalHours || "-")}</td></tr>`,
                    )
                    .join("")}</tbody></table>`
                : "<p>Sin registros.</p>"
            }
            <h2>Experiencia</h2>
            ${
              resume.experienceRecords.length > 0
                ? `<table><thead><tr><th>Empresa</th><th>Cargo</th><th>Ciudad</th><th>Periodo</th><th>Funciones</th></tr></thead><tbody>${resume.experienceRecords
                    .map(
                      (record) =>
                        `<tr><td>${sanitizeHtml(record.company)}</td><td>${sanitizeHtml(record.position)}</td><td>${sanitizeHtml(record.city)}</td><td>${sanitizeHtml(formatDateLabel(record.startDate))} - ${sanitizeHtml(record.currentlyWorking === "SI" ? "Actual" : formatDateLabel(record.endDate))}</td><td>${sanitizeHtml(record.responsibilities)}</td></tr>`,
                    )
                    .join("")}</tbody></table>`
                : "<p>Sin registros.</p>"
            }
            <h2>Referencias personales</h2>
            ${
              resume.referenceRecords.length > 0
                ? `<table><thead><tr><th>Nombre</th><th>Relacion</th><th>Telefono</th><th>Correo</th><th>Ciudad</th></tr></thead><tbody>${resume.referenceRecords
                    .map(
                      (record) =>
                        `<tr><td>${sanitizeHtml(record.fullName)}</td><td>${sanitizeHtml(record.relationship)}</td><td>${sanitizeHtml(record.phone)}</td><td>${sanitizeHtml(record.email || "-")}</td><td>${sanitizeHtml(record.city)}</td></tr>`,
                    )
                    .join("")}</tbody></table>`
                : "<p>Sin registros.</p>"
            }
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      window.setTimeout(() => {
        printWindow.print();
      }, 300);
    } catch (error) {
      printWindow.close();
      showToast({
        title: "No se pudo generar el PDF",
        description: error instanceof Error ? error.message : "No se pudo construir la hoja de vida desde backend.",
      });
    }
  };

  const currentTitle =
    activeSection === "informacion-personal"
      ? "Informacion personal"
      : activeSection === "instruccion-formal"
        ? "Instruccion formal"
        : activeSection === "idiomas"
          ? "Idiomas"
          : activeSection === "capacitaciones"
            ? "Capacitaciones / Certificaciones"
            : activeSection === "experiencia"
              ? "Experiencia"
              : "Referencias personales";

  const currentDescription =
    activeSection === "informacion-personal"
      ? "Completa los datos base de tu perfil para comenzar a construir tu hoja de vida."
      : activeSection === "instruccion-formal"
        ? "Selecciona el nivel de instruccion y prepara el detalle academico correspondiente."
        : activeSection === "idiomas"
          ? "Agrega los idiomas que dominas con su nivel hablado y escrito."
        : activeSection === "capacitaciones"
          ? "Registra cursos, talleres y certificaciones relevantes para tu perfil."
          : activeSection === "experiencia"
            ? "Registra experiencias relevantes para tu perfil profesional."
            : "";

  const currentSaveHandler =
    activeSection === "informacion-personal"
      ? handleSave
      : activeSection === "instruccion-formal"
        ? handleEducationSave
        : activeSection === "idiomas"
          ? handleLanguageSave
        : activeSection === "capacitaciones"
          ? handleTrainingSave
          : activeSection === "experiencia"
            ? handleExperienceSave
            : handleReferenceSave;

  return (
    <div className="grid gap-6 xl:grid-cols-[290px_1fr]">
      <Card className="rounded-[1.75rem] border-border/70 bg-card/90 xl:sticky xl:top-6 xl:h-fit">
        <CardHeader>
          <CardTitle className="text-xl">Hoja de Vida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resumeSections.map((section) => {
            const active = section.id === activeSection;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionClick(section)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/70 bg-background/50 text-foreground hover:bg-accent/50",
                )}
              >
                <span>{section.label}</span>
                {section.available ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <span className="text-xs text-muted-foreground">Proximamente</span>
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border-border/70 bg-card/90">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl">{currentTitle}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{currentDescription}</p>
          </div>
          {activeSection !== "capacitaciones" && activeSection !== "experiencia" && activeSection !== "referencias" ? (
            <Button
              onClick={currentSaveHandler}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              <Save className="mr-2 size-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Cumplimiento hoja de vida
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{resumeCompletion}%</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    El avance considera informacion personal, secciones cargadas y CV propio en PDF.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={handleDownloadResumePdf}>
                  <Download className="mr-2 size-4" />
                  Descargar PDF
                </Button>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${resumeCompletion}%` }}
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Hoja de vida propia
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sube tu CV en PDF. Recomendacion y validacion: maximo 2 MB.
                  </p>
                </div>
                {cvDocument ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    CV cargado
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Pendiente
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-[1.25rem] border border-input bg-background/70 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {selectedCvFile ? selectedCvFile.name : cvDocument?.fileName ?? "No has seleccionado ningun PDF"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Solo PDF, hasta 2 MB. Si ya tienes uno cargado, puedes reemplazarlo con una nueva version.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor="resume-cv-file"
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Elegir PDF
                  </label>
                  <Input
                    id="resume-cv-file"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(event) => setSelectedCvFile(event.target.files?.[0] ?? null)}
                  />
                  <Button type="button" onClick={handleCvUpload} disabled={isUploadingCv}>
                    <Upload className="mr-2 size-4" />
                    {isUploadingCv ? "Subiendo..." : "Subir hoja de vida"}
                  </Button>
                  {cvDocument ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={activeDocumentId === cvDocument.id}
                        onClick={() => void handleOpenCv(false)}
                      >
                        Ver PDF
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={activeDocumentId === cvDocument.id}
                        onClick={() => void handleOpenCv(true)}
                      >
                        Descargar PDF
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {activeSection === "informacion-personal" ? (
            <>
          {isLoadingProfile ? (
            <div className="rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
              Cargando informacion personal...
            </div>
          ) : null}
          <section className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Datos personales
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="No. del documento C.I. / Pasaporte"
                value={form.documentNumber}
                onChange={(value) => updateField("documentNumber", value)}
                required
              />
              <TextField
                label="Apellido paterno"
                value={form.paternalLastName}
                onChange={(value) => updateField("paternalLastName", value)}
                required
              />
              <TextField
                label="Apellido materno"
                value={form.maternalLastName}
                onChange={(value) => updateField("maternalLastName", value)}
              />
              <TextField
                label="Primer nombre"
                value={form.firstName}
                onChange={(value) => updateField("firstName", value)}
                required
              />
              <TextField
                label="Segundo nombre"
                value={form.middleName}
                onChange={(value) => updateField("middleName", value)}
              />
              <TextField
                label="Fecha de nacimiento"
                type="date"
                value={form.birthDate}
                onChange={(value) => updateField("birthDate", value)}
              />
              <SelectField
                label="Pais de nacimiento"
                value={form.birthCountry}
                onChange={(value) => updateField("birthCountry", value)}
                options={["Ecuador", "Colombia", "Peru", "Venezuela", "Otro"]}
              />
              <TextField
                label="Edad"
                value={calculateAge(form.birthDate)}
                onChange={() => undefined}
                disabled
              />
              <SelectField
                label="Genero"
                value={form.gender}
                onChange={(value) => updateField("gender", value)}
                options={["Masculino", "Femenino", "No binario", "Prefiero no decirlo"]}
                required
              />
              <SelectField
                label="Tipo de sangre"
                value={form.bloodType}
                onChange={(value) => updateField("bloodType", value)}
                options={["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}
              />
              <SelectField
                label="Estado civil"
                value={form.maritalStatus}
                onChange={(value) => updateField("maritalStatus", value)}
                options={["Soltero/a", "Casado/a", "Divorciado/a", "Union libre", "Viudo/a"]}
              />
              <SelectField
                label="Estado laboral"
                value={form.employmentStatus}
                onChange={(value) => updateField("employmentStatus", value)}
                options={["Desempleado", "Empleado", "Independiente", "Estudiante"]}
              />
              <SelectField
                label="Etnia"
                value={form.ethnicity}
                onChange={(value) => updateField("ethnicity", value)}
                options={["Mestizo/a", "Indigena", "Afrodescendiente", "Montubio/a", "Blanco/a", "Otro"]}
              />
              <BinaryChoice
                label="Es ciudadano ecuatoriano de nacimiento"
                value={form.ecuadorianCitizen}
                onChange={(value) => updateField("ecuadorianCitizen", value)}
              />
              <BinaryChoice
                label="Desea realizar entrevistas en linea"
                value={form.onlineInterviews}
                onChange={(value) => updateField("onlineInterviews", value)}
              />
              <BinaryChoice
                label="Tiene visa de residencia"
                value={form.residentVisa}
                onChange={(value) => updateField("residentVisa", value)}
              />
              <BinaryChoice
                label="Esta dispuesto a viajar"
                value={form.willingToTravel}
                onChange={(value) => updateField("willingToTravel", value)}
              />
              <BinaryChoice
                label="Tiene licencia"
                value={form.driversLicense}
                onChange={(value) => updateField("driversLicense", value)}
              />
              <SelectField
                label="Tipo de licencia"
                value={form.licenseType}
                onChange={(value) => updateField("licenseType", value)}
                options={["A", "B", "C", "D", "E", "F", "G", "Sin licencia"]}
              />
              <BinaryChoice
                label="Tiene vehiculo"
                value={form.hasVehicle}
                onChange={(value) => updateField("hasVehicle", value)}
              />
              <SelectField
                label="Tipo de vehiculo"
                value={form.vehicleType}
                onChange={(value) => updateField("vehicleType", value)}
                options={["Automovil", "Motocicleta", "Camioneta", "No aplica"]}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Direccion domiciliaria actual
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Pais"
                value={form.addressCountry}
                onChange={(value) => updateField("addressCountry", value)}
                options={["Ecuador", "Colombia", "Peru", "Venezuela", "Otro"]}
              />
              <TextField
                label="Provincia"
                value={form.province}
                onChange={(value) => updateField("province", value)}
                required
              />
              <TextField
                label="Canton"
                value={form.canton}
                onChange={(value) => updateField("canton", value)}
                required
              />
              <TextField
                label="Parroquia"
                value={form.parish}
                onChange={(value) => updateField("parish", value)}
              />
              <BinaryChoice
                label="Eres residente de la zona fronteriza"
                value={form.borderResident}
                onChange={(value) => updateField("borderResident", value)}
              />
              <BinaryChoice
                label="Eres residente de la provincia de Galapagos"
                value={form.galapagosResident}
                onChange={(value) => updateField("galapagosResident", value)}
              />
              <TextField
                label="Tipo de residencia en Galapagos"
                value={form.galapagosResidenceType}
                onChange={(value) => updateField("galapagosResidenceType", value)}
              />
              <TextField
                label="Calle principal"
                value={form.mainStreet}
                onChange={(value) => updateField("mainStreet", value)}
                required
              />
              <TextField
                label="Numero"
                value={form.number}
                onChange={(value) => updateField("number", value)}
              />
              <TextField
                label="Calle secundaria"
                value={form.secondaryStreet}
                onChange={(value) => updateField("secondaryStreet", value)}
              />
              <TextField
                label="Sector"
                value={form.sector}
                onChange={(value) => updateField("sector", value)}
              />
              <TextField
                label="Referencia"
                value={form.reference}
                onChange={(value) => updateField("reference", value)}
              />
              <TextField
                label="Telefono domicilio"
                value={form.homePhone}
                onChange={(value) => updateField("homePhone", value)}
              />
              <TextField
                label="Telefono familiar o contacto"
                value={form.familyPhone}
                onChange={(value) => updateField("familyPhone", value)}
              />
              <TextField
                label="Telefono trabajo"
                value={form.workPhone}
                onChange={(value) => updateField("workPhone", value)}
              />
              <TextField
                label="Celular"
                value={form.mobilePhone}
                onChange={(value) => updateField("mobilePhone", value)}
              />
              <TextField
                label="Correo electronico 1"
                type="email"
                value={form.email1}
                onChange={(value) => updateField("email1", value)}
                required
              />
              <TextField
                label="Correo electronico 2"
                type="email"
                value={form.email2}
                onChange={(value) => updateField("email2", value)}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Participacion de personas con discapacidad
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <BinaryChoice
                label="Tienes algun tipo de discapacidad"
                value={form.hasDisability}
                onChange={(value) => updateField("hasDisability", value)}
              />
              <TextField
                label="No. carnet CONADIS"
                value={form.conadisNumber}
                onChange={(value) => updateField("conadisNumber", value)}
              />
              <SelectField
                label="Tipo de discapacidad"
                value={form.disabilityType}
                onChange={(value) => updateField("disabilityType", value)}
                options={["Fisica", "Auditiva", "Visual", "Intelectual", "Psicosocial", "Otra"]}
              />
              <TextField
                label="Porcentaje de discapacidad"
                value={form.disabilityPercentage}
                onChange={(value) => updateField("disabilityPercentage", value)}
                placeholder="Ej. 36"
              />
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              <Save className="mr-2 size-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
            </>
          ) : activeSection === "instruccion-formal" ? (
            <>
              <section className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <div className="grid gap-4 md:grid-cols-[240px_1fr] md:items-center">
                    <p className="text-sm font-semibold text-foreground">Agregue un nivel de instruccion</p>
                    <select
                      value={educationForm.educationLevel}
                      onChange={(event) => handleEducationLevelSelect(event.target.value)}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      {educationLevelOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
                  <div className="hidden grid-cols-[1.1fr_1.3fr_1.3fr_1fr_140px] gap-0 border-b border-border/70 bg-background/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                    <div>Nivel de instruccion</div>
                    <div>Institucion educativa</div>
                    <div>Titulo obtenido</div>
                    <div>No. registro SENESCYT</div>
                    <div>Accion</div>
                  </div>
                  <div className="space-y-0">
                    {educationRecords.map((record) => (
                      <div
                        key={record.id}
                        className="grid gap-3 border-b border-border/60 bg-card px-4 py-4 last:border-b-0 md:grid-cols-[1.1fr_1.3fr_1.3fr_1fr_140px] md:items-center"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Nivel de instruccion
                          </p>
                          <p className="font-medium">{record.level}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Institucion educativa
                          </p>
                          <p>{record.institution}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Titulo obtenido
                          </p>
                          <p>{record.title}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            SENESCYT
                          </p>
                          <p>{record.senescyt}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEducationEdit(record)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/candidate/education/${record.id}`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });

                                if (!response.ok) {
                                  const errorPayload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
                                  const message = Array.isArray(errorPayload?.message)
                                    ? errorPayload.message.join(". ")
                                    : errorPayload?.message || "No se pudo eliminar la instruccion formal.";
                                  throw new Error(message);
                                }

                                setEducationRecords((current) =>
                                  current.filter((item) => item.id !== record.id),
                                );
                                await syncPersistedResumeCompletion();
                                showToast({
                                  title: "Instruccion eliminada",
                                  description: "El registro academico fue eliminado de tu perfil.",
                                });
                              } catch (error) {
                                showToast({
                                  title: "No se pudo eliminar",
                                  description: error instanceof Error ? error.message : "No se pudo eliminar la instruccion formal.",
                                });
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {educationForm.educationLevel !== "Seleccione" ? (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {editingEducationId ? "Editar instruccion formal" : "Detalle de instruccion formal"}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label="Institucion educativa"
                      value={educationForm.institutionType}
                      onChange={(value) =>
                        setEducationForm((current) => ({ ...current, institutionType: value }))
                      }
                      options={educationalInstitutionOptions}
                      required
                    />
                    <SelectField
                      label="Area de estudios"
                      value={educationForm.studyArea}
                      onChange={(value) =>
                        setEducationForm((current) => ({ ...current, studyArea: value }))
                      }
                      options={studyAreaOptions}
                    />
                    <div className="grid gap-4 sm:grid-cols-[1fr_140px] md:col-span-2">
                      <TextField
                        label="Tiempo de estudio"
                        value={educationForm.studyTimeValue}
                        onChange={(value) =>
                          setEducationForm((current) => ({ ...current, studyTimeValue: value }))
                        }
                      />
                      <SelectField
                        label="Unidad"
                        value={educationForm.studyTimeUnit}
                        onChange={(value) =>
                          setEducationForm((current) => ({ ...current, studyTimeUnit: value }))
                        }
                        options={["Ano", "Mes", "Semestre"]}
                      />
                    </div>
                    <SelectField
                      label="Ano de egresamiento o graduacion"
                      value={educationForm.graduationYear}
                      onChange={(value) =>
                        setEducationForm((current) => ({ ...current, graduationYear: value }))
                      }
                      options={Array.from({ length: 60 }, (_, index) => String(2026 - index))}
                    />
                    <TextField
                      label="No. del registro SENESCYT"
                      value={educationForm.senescytNumber}
                      onChange={(value) =>
                        setEducationForm((current) => ({ ...current, senescytNumber: value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleEducationCancel}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleEducationSave} disabled={isSaving} className="w-full sm:w-auto">
                      <Save className="mr-2 size-4" />
                      {isSaving
                        ? "Guardando..."
                        : editingEducationId
                          ? "Guardar cambios"
                          : "Guardar instruccion"}
                    </Button>
                  </div>
                </section>
              ) : null}
            </>
          ) : activeSection === "idiomas" ? (
            <>
              <section className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Agregar idioma
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField
                    label="Idiomas"
                    value={languageForm.language}
                    onChange={(value) =>
                      setLanguageForm((current) => ({ ...current, language: value }))
                    }
                    options={languageOptions}
                    required
                  />
                  <SelectField
                    label="Nivel hablado"
                    value={languageForm.spokenLevel}
                    onChange={(value) =>
                      setLanguageForm((current) => ({ ...current, spokenLevel: value }))
                    }
                    options={languageLevelOptions}
                    required
                  />
                  <SelectField
                    label="Nivel escrito"
                    value={languageForm.writtenLevel}
                    onChange={(value) =>
                      setLanguageForm((current) => ({ ...current, writtenLevel: value }))
                    }
                    options={languageLevelOptions}
                    required
                  />
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button onClick={handleLanguageSave} disabled={isSaving} className="w-full sm:w-auto">
                    <Save className="mr-2 size-4" />
                    {isSaving ? "Guardando..." : "Guardar idioma"}
                  </Button>
                </div>
              </section>

              <section className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Idiomas ingresados
                  </p>
                </div>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
                  <div className="hidden grid-cols-[1.2fr_1fr_1fr_140px] gap-0 border-b border-border/70 bg-background/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                    <div>Idiomas</div>
                    <div>Nivel hablado</div>
                    <div>Nivel escrito</div>
                    <div>Accion</div>
                  </div>
                  <div className="space-y-0">
                    {languageRecords.map((record) => (
                      <div
                        key={record.id}
                        className="grid gap-3 border-b border-border/60 bg-card px-4 py-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_1fr_140px] md:items-center"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Idioma
                          </p>
                          <p className="font-medium">{record.language}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Nivel hablado
                          </p>
                          <p>{record.spokenLevel}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Nivel escrito
                          </p>
                          <p>{record.writtenLevel}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleLanguageEdit(record)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/candidate/languages/${record.id}`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });

                                if (!response.ok) {
                                  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
                                  throw new Error(payload?.message ?? "No se pudo eliminar el idioma.");
                                }

                                setLanguageRecords((current) =>
                                  current.filter((item) => item.id !== record.id),
                                );
                                await syncPersistedResumeCompletion();
                                showToast({
                                  title: "Idioma eliminado",
                                  description: "El idioma se retiro de tu hoja de vida.",
                                });
                              } catch (error) {
                                showToast({
                                  title: "No se pudo eliminar",
                                  description:
                                    error instanceof Error ? error.message : "No se pudo eliminar el idioma.",
                                });
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {editingLanguageId ? (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Editar idioma
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <SelectField
                      label="Idiomas"
                      value={languageForm.language}
                      onChange={(value) =>
                        setLanguageForm((current) => ({ ...current, language: value }))
                      }
                      options={languageOptions}
                      required
                    />
                    <SelectField
                      label="Nivel hablado"
                      value={languageForm.spokenLevel}
                      onChange={(value) =>
                        setLanguageForm((current) => ({ ...current, spokenLevel: value }))
                      }
                      options={languageLevelOptions}
                      required
                    />
                    <SelectField
                      label="Nivel escrito"
                      value={languageForm.writtenLevel}
                      onChange={(value) =>
                        setLanguageForm((current) => ({ ...current, writtenLevel: value }))
                      }
                      options={languageLevelOptions}
                      required
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLanguageCancel}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleLanguageUpdate} disabled={isSaving} className="w-full sm:w-auto">
                      <Save className="mr-2 size-4" />
                      {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </section>
              ) : null}
            </>
          ) : activeSection === "capacitaciones" ? (
            <>
              <section className="space-y-4">
                <div className="flex justify-end">
                  <Button type="button" onClick={handleNewTraining} className="w-full sm:w-auto">
                    Nueva capacitacion
                  </Button>
                </div>

                {showNewTrainingForm ? (
                  <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Nueva capacitacion
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Institucion"
                        value={trainingForm.institution}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, institution: value }))
                        }
                        required
                      />
                      <SelectField
                        label="Tipo de evento"
                        value={trainingForm.eventType}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, eventType: value }))
                        }
                        options={trainingEventTypeOptions}
                        required
                      />
                      <TextField
                        label="Nombre del evento"
                        value={trainingForm.eventName}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, eventName: value }))
                        }
                        required
                      />
                      <SelectField
                        label="Area de estudios"
                        value={trainingForm.studyArea}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, studyArea: value }))
                        }
                        options={studyAreaOptions}
                        required
                      />
                      <SelectField
                        label="Tipo de certificado"
                        value={trainingForm.certificationType}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, certificationType: value }))
                        }
                        options={certificationTypeOptions}
                        required
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                          label="Fecha desde"
                          type="date"
                          value={trainingForm.startDate}
                          onChange={(value) =>
                            setTrainingForm((current) => ({ ...current, startDate: value }))
                          }
                          required
                        />
                        <TextField
                          label="Fecha hasta"
                          type="date"
                          value={trainingForm.endDate}
                          onChange={(value) =>
                            setTrainingForm((current) => ({ ...current, endDate: value }))
                          }
                          required
                        />
                      </div>
                      <TextField
                        label="Numero de dias"
                        value={trainingForm.totalDays}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, totalDays: value }))
                        }
                        required
                      />
                      <TextField
                        label="Numero de horas totales"
                        value={trainingForm.totalHours}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, totalHours: value }))
                        }
                        required
                      />
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTrainingCancel}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleTrainingSave} disabled={isSaving} className="w-full sm:w-auto">
                        <Save className="mr-2 size-4" />
                        {isSaving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Capacitaciones ingresadas
                  </p>
                </div>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
                  <div className="hidden grid-cols-[1.2fr_0.9fr_1fr_1.2fr_0.9fr_0.9fr_0.9fr_0.6fr_0.6fr_140px] gap-0 border-b border-border/70 bg-background/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                    <div>Institucion</div>
                    <div>Tipo evento</div>
                    <div>Area de estudios</div>
                    <div>Nombre evento</div>
                    <div>Certificado</div>
                    <div>Fecha desde</div>
                    <div>Fecha hasta</div>
                    <div>Dias</div>
                    <div>Horas</div>
                    <div>Accion</div>
                  </div>
                  <div className="space-y-0">
                    {trainingRecords.map((record) => (
                      <div
                        key={record.id}
                        className="grid gap-3 border-b border-border/60 bg-card px-4 py-4 last:border-b-0 md:grid-cols-[1.2fr_0.9fr_1fr_1.2fr_0.9fr_0.9fr_0.9fr_0.6fr_0.6fr_140px] md:items-center"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Institucion
                          </p>
                          <p className="font-medium">{record.institution}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Tipo evento
                          </p>
                          <p>{record.eventType}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Area de estudios
                          </p>
                          <p>{record.studyArea}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Nombre evento
                          </p>
                          <p>{record.eventName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Certificado
                          </p>
                          <p>{record.certificationType}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Fecha desde
                          </p>
                          <p>{record.startDate}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Fecha hasta
                          </p>
                          <p>{record.endDate}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Dias
                          </p>
                          <p>{record.totalDays}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Horas
                          </p>
                          <p>{record.totalHours}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleTrainingEdit(record)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/candidate/trainings/${record.id}`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });

                                if (!response.ok) {
                                  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
                                  throw new Error(payload?.message ?? "No se pudo eliminar la capacitacion.");
                                }

                                setTrainingRecords((current) =>
                                  current.filter((item) => item.id !== record.id),
                                );
                                await syncPersistedResumeCompletion();
                                showToast({
                                  title: "Capacitacion eliminada",
                                  description: "La capacitacion se retiro de tu hoja de vida.",
                                });
                              } catch (error) {
                                showToast({
                                  title: "No se pudo eliminar",
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "No se pudo eliminar la capacitacion.",
                                });
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {editingTrainingId ? (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Editar capacitacion
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Institucion"
                      value={trainingForm.institution}
                      onChange={(value) =>
                        setTrainingForm((current) => ({ ...current, institution: value }))
                      }
                      required
                    />
                    <SelectField
                      label="Tipo de evento"
                      value={trainingForm.eventType}
                      onChange={(value) =>
                        setTrainingForm((current) => ({ ...current, eventType: value }))
                      }
                      options={trainingEventTypeOptions}
                      required
                    />
                    <TextField
                      label="Nombre del evento"
                      value={trainingForm.eventName}
                      onChange={(value) =>
                        setTrainingForm((current) => ({ ...current, eventName: value }))
                      }
                      required
                    />
                    <SelectField
                      label="Area de estudios"
                      value={trainingForm.studyArea}
                      onChange={(value) =>
                        setTrainingForm((current) => ({ ...current, studyArea: value }))
                      }
                      options={studyAreaOptions}
                      required
                    />
                    <SelectField
                      label="Tipo de certificado"
                      value={trainingForm.certificationType}
                      onChange={(value) =>
                        setTrainingForm((current) => ({ ...current, certificationType: value }))
                      }
                      options={certificationTypeOptions}
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Fecha desde"
                        type="date"
                        value={trainingForm.startDate}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, startDate: value }))
                        }
                        required
                      />
                      <TextField
                        label="Fecha hasta"
                        type="date"
                        value={trainingForm.endDate}
                        onChange={(value) =>
                          setTrainingForm((current) => ({ ...current, endDate: value }))
                        }
                        required
                      />
                    </div>
                    <TextField
                      label="Numero de dias"
                      value={trainingForm.totalDays}
                      onChange={(value) =>
                        setTrainingForm((current) => ({ ...current, totalDays: value }))
                      }
                      required
                    />
                    <TextField
                      label="Numero de horas totales"
                      value={trainingForm.totalHours}
                      onChange={(value) =>
                        setTrainingForm((current) => ({ ...current, totalHours: value }))
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTrainingCancel}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleTrainingUpdate} disabled={isSaving} className="w-full sm:w-auto">
                      <Save className="mr-2 size-4" />
                      {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </section>
              ) : null}
            </>
          ) : activeSection === "experiencia" ? (
            <>
              <section className="space-y-4">
                <div className="flex justify-end">
                  <Button type="button" onClick={handleNewExperience} className="w-full sm:w-auto">
                    Nueva experiencia
                  </Button>
                </div>

                {showNewExperienceForm ? (
                  <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Nueva experiencia
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Lugar de trabajo / Empresa"
                        value={experienceForm.company}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, company: value }))
                        }
                        required
                      />
                      <TextField
                        label="Cargo"
                        value={experienceForm.position}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, position: value }))
                        }
                        required
                      />
                      <TextField
                        label="Area o departamento"
                        value={experienceForm.department}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, department: value }))
                        }
                      />
                      <TextField
                        label="Ciudad"
                        value={experienceForm.city}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, city: value }))
                        }
                        required
                      />
                      <SelectField
                        label="Tipo de contrato"
                        value={experienceForm.contractType}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, contractType: value }))
                        }
                        options={["Seleccione", "Indefinido", "Plazo fijo", "Temporal", "Servicios profesionales", "Pasantia", "Otro"]}
                        required
                      />
                      <SelectField
                        label="Jornada"
                        value={experienceForm.workday}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, workday: value }))
                        }
                        options={["Seleccione", "Tiempo completo", "Medio tiempo", "Por horas", "Remoto", "Hibrido", "Otro"]}
                        required
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                          label="Fecha de inicio"
                          type="date"
                          value={experienceForm.startDate}
                          onChange={(value) =>
                            setExperienceForm((current) => ({ ...current, startDate: value }))
                          }
                          required
                        />
                        <TextField
                          label="Fecha de fin"
                          type="date"
                          value={experienceForm.endDate}
                          onChange={(value) =>
                            setExperienceForm((current) => ({ ...current, endDate: value }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <BinaryChoice
                          label="Trabaja actualmente aqui"
                          value={experienceForm.currentlyWorking}
                          onChange={(value) =>
                            setExperienceForm((current) => ({ ...current, currentlyWorking: value }))
                          }
                        />
                      </div>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">Funciones principales *</span>
                        <textarea
                          value={experienceForm.responsibilities}
                          onChange={(event) =>
                            setExperienceForm((current) => ({ ...current, responsibilities: event.target.value }))
                          }
                          rows={4}
                          className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">Logros o resultados</span>
                        <textarea
                          value={experienceForm.achievements}
                          onChange={(event) =>
                            setExperienceForm((current) => ({ ...current, achievements: event.target.value }))
                          }
                          rows={3}
                          className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">Motivo de salida</span>
                        <textarea
                          value={experienceForm.exitReason}
                          onChange={(event) =>
                            setExperienceForm((current) => ({ ...current, exitReason: event.target.value }))
                          }
                          rows={3}
                          className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"
                        />
                      </label>
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleExperienceCancel}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleExperienceSave} disabled={isSaving} className="w-full sm:w-auto">
                        <Save className="mr-2 size-4" />
                        {isSaving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Experiencias ingresadas
                  </p>
                </div>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
                  <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.9fr_0.9fr_0.9fr_1.4fr_1.2fr_140px] gap-0 border-b border-border/70 bg-background/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                    <div>Empresa</div>
                    <div>Cargo</div>
                    <div>Departamento</div>
                    <div>Ciudad</div>
                    <div>Contrato</div>
                    <div>Jornada</div>
                    <div>Funciones</div>
                    <div>Motivo salida</div>
                    <div>Accion</div>
                  </div>
                  <div className="space-y-0">
                    {experienceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="grid gap-3 border-b border-border/60 bg-card px-4 py-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_1fr_0.9fr_0.9fr_0.9fr_1.4fr_1.2fr_140px] md:items-center"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Empresa
                          </p>
                          <p className="font-medium">{record.company}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Cargo
                          </p>
                          <p>{record.position}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Departamento
                          </p>
                          <p>{record.department}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Ciudad
                          </p>
                          <p>{record.city}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Contrato
                          </p>
                          <p>{record.contractType}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Jornada
                          </p>
                          <p>{record.workday}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Funciones
                          </p>
                          <p>{record.responsibilities}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Motivo salida
                          </p>
                          <p>{record.exitReason}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleExperienceEdit(record)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/candidate/experience/${record.id}`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });

                                if (!response.ok) {
                                  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
                                  throw new Error(payload?.message ?? "No se pudo eliminar la experiencia.");
                                }

                                setExperienceRecords((current) =>
                                  current.filter((item) => item.id !== record.id),
                                );
                                await syncPersistedResumeCompletion();
                                showToast({
                                  title: "Experiencia eliminada",
                                  description: "La experiencia se retiro de tu hoja de vida.",
                                });
                              } catch (error) {
                                showToast({
                                  title: "No se pudo eliminar",
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "Ocurrio un problema al eliminar la experiencia.",
                                });
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {editingExperienceId ? (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Editar experiencia
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Lugar de trabajo / Empresa"
                      value={experienceForm.company}
                      onChange={(value) =>
                        setExperienceForm((current) => ({ ...current, company: value }))
                      }
                      required
                    />
                    <TextField
                      label="Cargo"
                      value={experienceForm.position}
                      onChange={(value) =>
                        setExperienceForm((current) => ({ ...current, position: value }))
                      }
                      required
                    />
                    <TextField
                      label="Area o departamento"
                      value={experienceForm.department}
                      onChange={(value) =>
                        setExperienceForm((current) => ({ ...current, department: value }))
                      }
                    />
                    <TextField
                      label="Ciudad"
                      value={experienceForm.city}
                      onChange={(value) =>
                        setExperienceForm((current) => ({ ...current, city: value }))
                      }
                      required
                    />
                    <SelectField
                      label="Tipo de contrato"
                      value={experienceForm.contractType}
                      onChange={(value) =>
                        setExperienceForm((current) => ({ ...current, contractType: value }))
                      }
                      options={["Seleccione", "Indefinido", "Plazo fijo", "Temporal", "Servicios profesionales", "Pasantia", "Otro"]}
                      required
                    />
                    <SelectField
                      label="Jornada"
                      value={experienceForm.workday}
                      onChange={(value) =>
                        setExperienceForm((current) => ({ ...current, workday: value }))
                      }
                      options={["Seleccione", "Tiempo completo", "Medio tiempo", "Por horas", "Remoto", "Hibrido", "Otro"]}
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Fecha de inicio"
                        type="date"
                        value={experienceForm.startDate}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, startDate: value }))
                        }
                        required
                      />
                      <TextField
                        label="Fecha de fin"
                        type="date"
                        value={experienceForm.endDate}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, endDate: value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <BinaryChoice
                        label="Trabaja actualmente aqui"
                        value={experienceForm.currentlyWorking}
                        onChange={(value) =>
                          setExperienceForm((current) => ({ ...current, currentlyWorking: value }))
                        }
                      />
                    </div>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-foreground">Funciones principales *</span>
                      <textarea
                        value={experienceForm.responsibilities}
                        onChange={(event) =>
                          setExperienceForm((current) => ({ ...current, responsibilities: event.target.value }))
                        }
                        rows={4}
                        className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-foreground">Logros o resultados</span>
                      <textarea
                        value={experienceForm.achievements}
                        onChange={(event) =>
                          setExperienceForm((current) => ({ ...current, achievements: event.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-foreground">Motivo de salida</span>
                      <textarea
                        value={experienceForm.exitReason}
                        onChange={(event) =>
                          setExperienceForm((current) => ({ ...current, exitReason: event.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"
                      />
                    </label>
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleExperienceCancel}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleExperienceUpdate} disabled={isSaving} className="w-full sm:w-auto">
                      <Save className="mr-2 size-4" />
                      {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <>
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="button" onClick={handleNewReference} className="w-full sm:w-auto">
                    Nueva referencia
                  </Button>
                </div>

                {showNewReferenceForm ? (
                  <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Nueva referencia personal
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Nombre completo"
                        value={referenceForm.fullName}
                        onChange={(value) =>
                          setReferenceForm((current) => ({ ...current, fullName: value }))
                        }
                        required
                      />
                      <TextField
                        label="Relacion"
                        value={referenceForm.relationship}
                        onChange={(value) =>
                          setReferenceForm((current) => ({ ...current, relationship: value }))
                        }
                        required
                      />
                      <TextField
                        label="Telefono"
                        value={referenceForm.phone}
                        onChange={(value) =>
                          setReferenceForm((current) => ({ ...current, phone: value }))
                        }
                        required
                      />
                      <TextField
                        label="Correo electronico"
                        type="email"
                        value={referenceForm.email}
                        onChange={(value) =>
                          setReferenceForm((current) => ({ ...current, email: value }))
                        }
                      />
                      <TextField
                        label="Ciudad"
                        value={referenceForm.city}
                        onChange={(value) =>
                          setReferenceForm((current) => ({ ...current, city: value }))
                        }
                        required
                      />
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReferenceCancel}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleReferenceSave} disabled={isSaving} className="w-full sm:w-auto">
                        <Save className="mr-2 size-4" />
                        {isSaving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Referencias personales ingresadas
                  </p>
                </div>
                <div className="overflow-hidden rounded-[1.5rem] border border-border/70">
                  <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_0.9fr_140px] gap-0 border-b border-border/70 bg-background/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                    <div>Nombre completo</div>
                    <div>Relacion</div>
                    <div>Telefono</div>
                    <div>Correo</div>
                    <div>Ciudad</div>
                    <div>Accion</div>
                  </div>
                  <div className="space-y-0">
                    {referenceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="grid gap-3 border-b border-border/60 bg-card px-4 py-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_1fr_1fr_0.9fr_140px] md:items-center"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Nombre completo
                          </p>
                          <p className="font-medium">{record.fullName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Relacion
                          </p>
                          <p>{record.relationship}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Telefono
                          </p>
                          <p>{record.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Correo
                          </p>
                          <p>{record.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
                            Ciudad
                          </p>
                          <p>{record.city}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleReferenceEdit(record)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (referenceRecords.length <= 1) {
                                showToast({
                                  title: "Minimo requerido",
                                  description: "Debes conservar al menos 1 referencia personal.",
                                });
                                return;
                              }

                              try {
                                const response = await fetch(`/api/candidate/references/${record.id}`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });

                                if (!response.ok) {
                                  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
                                  throw new Error(payload?.message ?? "No se pudo eliminar la referencia.");
                                }

                                setReferenceRecords((current) =>
                                  current.filter((item) => item.id !== record.id),
                                );
                                await syncPersistedResumeCompletion();
                                showToast({
                                  title: "Referencia eliminada",
                                  description: "La referencia se retiro de tu hoja de vida.",
                                });
                              } catch (error) {
                                showToast({
                                  title: "No se pudo eliminar",
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "No se pudo eliminar la referencia.",
                                });
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {editingReferenceId ? (
                <section className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Editar referencia personal
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Nombre completo"
                      value={referenceForm.fullName}
                      onChange={(value) =>
                        setReferenceForm((current) => ({ ...current, fullName: value }))
                      }
                      required
                    />
                    <TextField
                      label="Relacion"
                      value={referenceForm.relationship}
                      onChange={(value) =>
                        setReferenceForm((current) => ({ ...current, relationship: value }))
                      }
                      required
                    />
                    <TextField
                      label="Telefono"
                      value={referenceForm.phone}
                      onChange={(value) =>
                        setReferenceForm((current) => ({ ...current, phone: value }))
                      }
                      required
                    />
                    <TextField
                      label="Correo electronico"
                      type="email"
                      value={referenceForm.email}
                      onChange={(value) =>
                        setReferenceForm((current) => ({ ...current, email: value }))
                      }
                    />
                    <TextField
                      label="Ciudad"
                      value={referenceForm.city}
                      onChange={(value) =>
                        setReferenceForm((current) => ({ ...current, city: value }))
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReferenceCancel}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleReferenceUpdate} disabled={isSaving} className="w-full sm:w-auto">
                      <Save className="mr-2 size-4" />
                      {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </section>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
