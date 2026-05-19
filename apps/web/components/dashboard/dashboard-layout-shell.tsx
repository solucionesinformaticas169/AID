import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth/session";

type DashboardLayoutShellProps = {
  title: string;
  description: string;
  roleLabel: string;
  user: SessionUser | null;
  children: ReactNode;
};

export function DashboardLayoutShell({
  title,
  description,
  roleLabel,
  user,
  children,
}: DashboardLayoutShellProps) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-4 rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge variant="secondary" className="mb-3">{roleLabel}</Badge>
          <h2 className="text-3xl font-semibold">{title}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        <Card className="border-border/70 bg-secondary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sesion activa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{user?.email ?? "demo@aidlaboral.com"}</p>
            <p>Rol: {user?.role ?? roleLabel}</p>
          </CardContent>
        </Card>
      </div>
      {children}
    </main>
  );
}
