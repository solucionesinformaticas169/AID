export const vacancies = [
  {
    id: "vac-001",
    title: "Analista de Talento Humano",
    company: "AIDLABORAL S.A.S.",
    location: "Quito, Ecuador",
    modality: "Hibrido",
    salary: "$1,200 - $1,600",
    type: "Tiempo completo",
    summary:
      "Lidera procesos de seleccion, onboarding y seguimiento de indicadores de reclutamiento.",
  },
  {
    id: "vac-002",
    title: "Reclutador Senior TI",
    company: "AIDLABORAL S.A.S.",
    location: "Remoto LATAM",
    modality: "Remoto",
    salary: "$1,500 - $2,200",
    type: "Tiempo completo",
    summary:
      "Gestiona procesos especializados para perfiles de tecnologia y fortalece el pipeline comercial.",
  },
  {
    id: "vac-003",
    title: "Auxiliar de Seleccion",
    company: "AIDLABORAL S.A.S.",
    location: "Guayaquil, Ecuador",
    modality: "Presencial",
    salary: "$650 - $850",
    type: "Tiempo completo",
    summary:
      "Apoya filtro de hojas de vida, coordinacion de entrevistas y actualizacion documental.",
  },
  {
    id: "vac-004",
    title: "Coordinador de Seleccion",
    company: "AIDLABORAL S.A.S.",
    location: "Cuenca, Ecuador",
    modality: "Hibrido",
    salary: "$1,800 - $2,400",
    type: "Tiempo completo",
    summary:
      "Coordina reclutadores, valida indicadores de cierre y fortalece la relacion con empleadores.",
  },
];

export const candidateStats = [
  { label: "Postulaciones enviadas", value: "12" },
  { label: "Entrevistas activas", value: "3" },
  { label: "Documentos cargados", value: "5" },
];

export const companyStats = [
  { label: "Vacantes publicadas", value: "8" },
  { label: "Cargas gratuitas restantes", value: "2" },
  { label: "Postulaciones nuevas", value: "27" },
];

export const adminStats = [
  { label: "Empresas activas", value: "32" },
  { label: "Planes mensuales", value: "14" },
  { label: "Planes anuales", value: "6" },
];

export const candidateApplications = [
  {
    id: "app-001",
    vacancyTitle: "Analista de Talento Humano",
    company: "AIDLABORAL S.A.S.",
    status: "En revision",
    compatibility: 92,
    timeline: ["Aplicada", "En revision", "Preseleccionado"],
  },
  {
    id: "app-002",
    vacancyTitle: "Reclutador Senior TI",
    company: "AIDLABORAL S.A.S.",
    status: "Entrevista",
    compatibility: 88,
    timeline: ["Aplicada", "En revision", "Preseleccionado", "Entrevista"],
  },
  {
    id: "app-003",
    vacancyTitle: "Coordinador de Seleccion",
    company: "AIDLABORAL S.A.S.",
    status: "Aplicada",
    compatibility: 76,
    timeline: ["Aplicada"],
  },
];

export const companyApplicationStats = [
  { status: "Aplicada", total: 18 },
  { status: "En revision", total: 7 },
  { status: "Preseleccionado", total: 4 },
  { status: "Entrevista", total: 3 },
  { status: "Rechazado", total: 2 },
  { status: "Contratado", total: 1 },
];

export const saasPlans = [
  {
    code: "FREE",
    name: "Gratis",
    price: "$0",
    limit: "10 vacantes",
    priority: "No",
    metrics: "Basicas",
    featuredCandidates: "No",
  },
  {
    code: "PROFESSIONAL",
    name: "Profesional",
    price: "$49 / mes",
    limit: "25 vacantes",
    priority: "Si",
    metrics: "Avanzadas",
    featuredCandidates: "Si",
  },
  {
    code: "ENTERPRISE",
    name: "Empresarial",
    price: "$149 / mes",
    limit: "Ilimitadas",
    priority: "Alta",
    metrics: "Ejecutivas",
    featuredCandidates: "Si",
  },
];

export const billingHistory = [
  {
    id: "pay-001",
    provider: "Stripe",
    plan: "Profesional",
    amount: "$49",
    status: "Pagado",
    date: "2026-05-10",
  },
  {
    id: "pay-002",
    provider: "PayPal",
    plan: "Profesional",
    amount: "$49",
    status: "Pendiente",
    date: "2026-05-18",
  },
];

export const invoiceHistory = [
  {
    id: "inv-001",
    number: "AID-DEMO-20260510",
    plan: "Profesional",
    total: "$49",
    status: "Pagada",
  },
  {
    id: "inv-002",
    number: "AID-DEMO-20260518",
    plan: "Profesional",
    total: "$49",
    status: "Emitida",
  },
];

export const siteMenu = [
  { href: "#quienes-somos", label: "Quienes somos" },
  { href: "#objetivos", label: "Objetivos" },
  { href: "#ciudadania", label: "Servicios a la ciudadania" },
  { href: "#empleadores", label: "Servicios para empleadores" },
  { href: "#ventajas", label: "Ventajas de trabajar con AIDLABORAL S.A.S" },
  { href: "#contacto", label: "Contactanos" },
];

export const serviceBlocks = {
  citizen: [
    "Orientacion ocupacional y perfilamiento laboral.",
    "Registro de hoja de vida y actualizacion documental.",
    "Postulacion a vacantes con seguimiento del proceso.",
  ],
  employers: [
    "Publicacion y moderacion de vacantes.",
    "Acceso a candidatos filtrados por perfil.",
    "Control de planes, cargas gratuitas y reclutadores.",
  ],
};
