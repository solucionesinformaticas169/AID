import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export default function AdminDashboardPage() {
  return (
    <SidebarShell
      title="Panel administrador"
      description="Centro de gobierno del ATS con aprobaciones, moderacion y supervision transversal."
    >
      <AdminDashboardClient />
    </SidebarShell>
  );
}
