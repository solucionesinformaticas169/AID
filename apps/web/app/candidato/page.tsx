import { CandidateDashboardClient } from "@/components/dashboard/candidate-dashboard-client";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export default function CandidateDashboardPage() {
  return (
    <SidebarShell
      title="Panel de candidato"
      description="Experiencia de seguimiento laboral con filtros, timeline y compatibilidad ATS."
    >
      <CandidateDashboardClient />
    </SidebarShell>
  );
}
