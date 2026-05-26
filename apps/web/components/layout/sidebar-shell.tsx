import type { ReactNode } from "react";
import { PanelTop } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
      </Card>
      <section>{children}</section>
    </main>
  );
}
