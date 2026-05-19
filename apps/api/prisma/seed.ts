import { hash } from "bcryptjs";
import { PrismaClient, RoleScope, PlanCode, CompanyStatus } from "@prisma/client";

import { ROLE_CODES } from "../src/common/constants/role-codes";

const prisma = new PrismaClient();
const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL ?? "admin@aidlaboral.com";
const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD ?? "Admin123*";
const seedDemoCompany = (process.env.SEED_DEMO_COMPANY ?? "false").toLowerCase() === "true";

async function main() {
  const roles = [
    {
      code: ROLE_CODES.CANDIDATE,
      name: "Candidato",
      description: "Usuario que aplica a vacantes.",
      scope: RoleScope.PLATFORM,
    },
    {
      code: ROLE_CODES.COMPANY_ADMIN,
      name: "Empresa Admin",
      description: "Administra vacantes y equipo de la empresa.",
      scope: RoleScope.COMPANY,
    },
    {
      code: ROLE_CODES.RECRUITER,
      name: "Reclutador",
      description: "Gestiona filtros y postulantes.",
      scope: RoleScope.COMPANY,
    },
    {
      code: ROLE_CODES.SYSTEM_ADMIN,
      name: "Administrador del sistema",
      description: "Supervisa la plataforma ATS.",
      scope: RoleScope.PLATFORM,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    });
  }

  const plans = [
    {
      code: PlanCode.FREE,
      name: "Gratis",
      description: "10 cargas gratuitas para nuevas empresas.",
      price: 0,
      durationMonths: 0,
      jobPostLimit: 10,
      priorityPublication: false,
      advancedMetrics: false,
      featuredCandidates: false,
      includesFreePosts: true,
      freeJobPostsIncluded: 10,
    },
    {
      code: PlanCode.PROFESSIONAL,
      name: "Profesional",
      description: "Mas visibilidad, metricas y candidatos destacados.",
      price: 49,
      durationMonths: 1,
      jobPostLimit: 25,
      priorityPublication: true,
      advancedMetrics: true,
      featuredCandidates: true,
      includesFreePosts: false,
      freeJobPostsIncluded: 0,
    },
    {
      code: PlanCode.ENTERPRISE,
      name: "Empresarial",
      description: "ATS premium con cobertura extendida y prioridad total.",
      price: 149,
      durationMonths: 1,
      jobPostLimit: null,
      priorityPublication: true,
      advancedMetrics: true,
      featuredCandidates: true,
      includesFreePosts: false,
      freeJobPostsIncluded: 0,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: ROLE_CODES.SYSTEM_ADMIN },
  });

  await prisma.user.upsert({
    where: { email: initialAdminEmail },
    update: {
      firstName: "Admin",
      lastName: "AIDLABORAL",
      primaryRoleId: adminRole.id,
      isActive: true,
    },
    create: {
      email: initialAdminEmail,
      passwordHash: await hash(initialAdminPassword, 10),
      firstName: "Admin",
      lastName: "AIDLABORAL",
      primaryRoleId: adminRole.id,
      isActive: true,
    },
  });

  if (seedDemoCompany) {
    await prisma.company.upsert({
      where: { slug: "aidlaboral-sas-demo" },
      update: {
        status: CompanyStatus.APPROVED,
        freeJobPostsIncluded: 10,
        freeJobPostsUsed: 2,
      },
      create: {
        name: "AIDLABORAL S.A.S. Demo",
        slug: "aidlaboral-sas-demo",
        status: CompanyStatus.APPROVED,
        freeJobPostsIncluded: 10,
        freeJobPostsUsed: 2,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
