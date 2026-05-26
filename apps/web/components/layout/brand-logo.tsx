import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <Image
            src="/logo-aidlaboral.jpeg"
            alt="Logo AIDLABORAL S.A.S."
            width={56}
            height={56}
            className="h-14 w-14 object-cover"
            priority
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AIDLABORAL</p>
          <p className="text-base font-semibold text-foreground">S.A.S.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-start gap-4", className)}>
      <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-[0_18px_42px_rgba(15,17,21,0.08)]">
        <Image
          src="/logo-aidlaboral.jpeg"
          alt="Logo AIDLABORAL S.A.S."
          width={240}
          height={240}
          className="h-auto w-[140px] sm:w-[180px]"
          priority
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AIDLABORAL S.A.S.</p>
        <p className="text-sm text-muted-foreground">Talento humano, reclutamiento y gestion empresarial.</p>
      </div>
    </div>
  );
}
