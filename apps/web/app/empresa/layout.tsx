import type { ReactNode } from "react";

import { DashboardLayoutShell } from "@/components/dashboard/dashboard-layout-shell";
import { getServerSession } from "@/lib/auth/session";

export default async function CompanyLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  return (
    <DashboardLayoutShell
      title="Dashboard de empresa"
      description="Administra publicaciones, postulantes y consumo de plan con controles de acceso por rol."
      roleLabel="COMPANY_ADMIN"
      user={session}
    >
      {children}
    </DashboardLayoutShell>
  );
}
