import type { ReactNode } from "react";

import { PrivateSessionGuard } from "@/components/auth/private-session-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth/session";

type DashboardLayoutShellProps = {
  title: string;
  description: string;
  roleLabel: string;
  user: SessionUser | null;
  actions?: ReactNode;
  children: ReactNode;
};

function formatRoleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    CANDIDATE: "Candidato",
    COMPANY_ADMIN: "EmpresaAdmin",
    RECRUITER: "Reclutador",
    SYSTEM_ADMIN: "SuperAdmin",
  };

  if (!role) {
    return "Sin rol";
  }

  return labels[role] ?? role;
}

export function DashboardLayoutShell({
  title,
  description,
  roleLabel,
  user,
  actions,
  children,
}: DashboardLayoutShellProps) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <PrivateSessionGuard user={user} />
      <div className="mb-8 grid gap-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 text-card-foreground shadow-sm lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="flex flex-col items-start justify-start gap-4 pt-1">
          <Badge variant="secondary">{roleLabel}</Badge>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        <Card className="border-border/70 bg-secondary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sesion activa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{user?.email ?? "demo@aidlaboral.com"}</p>
            <p>Rol: {formatRoleLabel(user?.role) ?? roleLabel}</p>
            <LogoutButton variant="outline" className="w-full justify-center" />
          </CardContent>
        </Card>
      </div>
      {children}
    </main>
  );
}
