import Link from "next/link";
import { BriefcaseBusiness, Menu, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteMenu } from "@/lib/mock-data";

const navItems = [
  ...siteMenu,
  { href: "/candidato", label: "Panel candidato" },
  { href: "/empresa", label: "Panel empresa" },
  { href: "/admin", label: "Panel admin" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-border/70 bg-card/80 p-3 text-primary shadow-sm">
            <BriefcaseBusiness className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AIDLABORAL</p>
            <h1 className="text-lg font-semibold text-foreground">ATS corporativo para talento humano</h1>
          </div>
        </div>
        <nav className="hidden flex-wrap justify-end gap-2 xl:flex">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground lg:flex">
            <Sparkles className="size-3.5 text-primary" />
            UI inspirada en LinkedIn Jobs, Workday y Notion
          </div>
          <ThemeToggle />
          <div className="flex items-center gap-2 xl:hidden">
            <Menu className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
