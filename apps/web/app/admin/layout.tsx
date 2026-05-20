import type { ReactNode } from "react";

import { AdminSidebarShell } from "@/components/dashboard/admin-sidebar-shell";
import { getServerSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  return (
    <AdminSidebarShell
      title="Panel del AdministradorSistema"
      description="Centro de control de AIDLABORAL para gobierno operativo, auditoria, seguridad y monetizacion."
      user={session}
    >
      {children}
    </AdminSidebarShell>
  );
}
