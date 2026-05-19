import { CompanyDashboardClient } from "@/components/dashboard/company-dashboard-client";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { getServerSession } from "@/lib/auth/session";

export default async function CompanyDashboardPage() {
  const session = await getServerSession();

  return (
    <SidebarShell
      title="Panel de empresa"
      description="Workspace corporativo con tablas, metricas y control operativo de reclutamiento."
    >
      <CompanyDashboardClient session={session} />
    </SidebarShell>
  );
}
