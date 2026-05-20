"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { CandidateHeaderActions } from "@/components/dashboard/candidate-header-actions";
import { DashboardLayoutShell } from "@/components/dashboard/dashboard-layout-shell";
import type { SessionUser } from "@/lib/auth/session";

export function CandidateLayoutShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isOpportunitiesPage = pathname === "/candidato/oportunidades";

  return (
    <DashboardLayoutShell
      title={isOpportunitiesPage ? "Busqueda de ofertas laborales" : "Dashboard de candidato"}
      description={
        isOpportunitiesPage
          ? "Encuentra oportunidades afines a tu perfil."
          : "Gestiona tu perfil profesional, documentos y postulaciones desde una vista protegida."
      }
      roleLabel="Candidato"
      user={user}
      actions={<CandidateHeaderActions />}
    >
      {children}
    </DashboardLayoutShell>
  );
}

