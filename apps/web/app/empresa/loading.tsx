import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyDashboardLoading() {
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
