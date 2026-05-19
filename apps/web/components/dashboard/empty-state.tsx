import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Card className="rounded-[1.5rem] border-dashed border-border/70 bg-card/70">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        <div className="rounded-3xl border border-border/70 bg-background/80 p-4 text-primary">{icon}</div>
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
