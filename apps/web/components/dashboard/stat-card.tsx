import type { ReactNode } from "react";

import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  onClick?: () => void;
};

export function StatCard({ label, value, helper, icon, onClick }: StatCardProps) {
  const card = (
    <Card className="overflow-hidden rounded-[1.5rem] border-border/60 bg-card/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card hover:shadow-lg hover:shadow-primary/10">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 p-3 text-primary transition-transform duration-200 group-hover:scale-105">
            {icon}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          <span>Actualizado ahora</span>
          <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </CardContent>
    </Card>
  );

  if (!onClick) {
    return card;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[1.5rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {card}
    </button>
  );
}
