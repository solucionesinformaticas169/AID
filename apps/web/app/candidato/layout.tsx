import type { ReactNode } from "react";

import { DashboardLayoutShell } from "@/components/dashboard/dashboard-layout-shell";
import { getServerSession } from "@/lib/auth/session";

export default async function CandidateLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  return (
    <DashboardLayoutShell
      title="Dashboard de candidato"
      description="Gestiona tu perfil profesional, documentos y postulaciones desde una vista protegida."
      roleLabel="CANDIDATE"
      user={session}
    >
      {children}
    </DashboardLayoutShell>
  );
}
