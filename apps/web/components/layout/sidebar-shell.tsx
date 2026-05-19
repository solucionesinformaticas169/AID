import type { ReactNode } from "react";
import { Activity, CircleGauge, PanelTop, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SidebarShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SidebarShell({ title, description, children }: SidebarShellProps) {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-6 py-10 xl:grid-cols-[290px_1fr]">
      <Card className="h-fit overflow-hidden rounded-[1.75rem] border-border/60 bg-card/85">
        <CardHeader>
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-primary">
              <PanelTop className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {[
            { icon: <CircleGauge className="size-4" />, label: "Vista ejecutiva", helper: "Metricas, filtros y tablas con foco en productividad." },
            { icon: <Activity className="size-4" />, label: "Estados UX", helper: "Loading, vacios, skeletons y feedback visual consistente." },
            { icon: <Sparkles className="size-4" />, label: "Design system", helper: "Cards modulares, modales y toasts listos para escalar." },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <span className={cn("text-primary")}>{item.icon}</span>
                {item.label}
              </div>
              <p className="text-sm text-muted-foreground">{item.helper}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <section>{children}</section>
    </main>
  );
}
