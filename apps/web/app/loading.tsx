import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function GlobalLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <DashboardSkeleton />
    </main>
  );
}
