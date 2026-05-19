import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-[1.5rem]" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-[1.5rem]" />
      <Skeleton className="h-[360px] rounded-[1.5rem]" />
    </div>
  );
}
