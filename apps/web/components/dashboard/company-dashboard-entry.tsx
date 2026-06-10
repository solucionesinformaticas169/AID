"use client";

import { useState } from "react";

import { CompanyDashboardClient } from "@/components/dashboard/company-dashboard-client";
import { DashboardLayoutShell } from "@/components/dashboard/dashboard-layout-shell";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionUser } from "@/lib/auth/session";

function CompanyDashboardPageSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 grid gap-5 rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-[0_18px_44px_rgba(33,29,8,0.06)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="space-y-4 pt-1">
          <Skeleton className="h-12 w-48 rounded-2xl" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-80 rounded-xl" />
            <Skeleton className="h-5 w-[28rem] max-w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-44 rounded-[1.5rem]" />
      </div>
      <DashboardSkeleton />
    </main>
  );
}

export function CompanyDashboardEntry({ session }: { session: SessionUser | null }) {
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="relative">
      {!isReady ? <CompanyDashboardPageSkeleton /> : null}
      <div
        className={isReady ? "" : "pointer-events-none invisible absolute inset-0"}
        aria-hidden={!isReady}
      >
        <DashboardLayoutShell
          title="Dashboard de empresa"
          description="Administra publicaciones, postulantes y consumo de plan con controles de acceso por rol."
          roleLabel="COMPANY_ADMIN"
          user={session}
        >
          <CompanyDashboardClient session={session} onInitialReady={() => setIsReady(true)} />
        </DashboardLayoutShell>
      </div>
    </div>
  );
}
