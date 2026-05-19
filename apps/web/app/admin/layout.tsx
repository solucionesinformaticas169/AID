import type { ReactNode } from "react";

import { DashboardLayoutShell } from "@/components/dashboard/dashboard-layout-shell";
import { getServerSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  return (
    <DashboardLayoutShell
      title="Dashboard administrativo"
      description="Supervisa empresas, vacantes y usuarios bajo una capa de seguridad con roles."
      roleLabel="SYSTEM_ADMIN"
      user={session}
    >
      {children}
    </DashboardLayoutShell>
  );
}
