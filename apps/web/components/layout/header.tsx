"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, ChevronDown, Menu } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteMenu } from "@/lib/mock-data";

export function Header() {
  const pathname = usePathname();
  const [isAboutMenuOpen, setIsAboutMenuOpen] = useState(false);
  const aboutMenuRef = useRef<HTMLDivElement | null>(null);
  const isPrivateRoute =
    pathname.startsWith("/candidato") ||
    pathname.startsWith("/empresa") ||
    pathname.startsWith("/admin");

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!aboutMenuRef.current?.contains(event.target as Node)) {
        setIsAboutMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAboutMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (isPrivateRoute) {
    return null;
  }

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
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Home</Link>
          </Button>

          <div className="relative" ref={aboutMenuRef}>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsAboutMenuOpen((current) => !current)}
              aria-expanded={isAboutMenuOpen}
              aria-haspopup="menu"
            >
              Nosotros
              <ChevronDown className={`size-4 transition ${isAboutMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isAboutMenuOpen ? (
              <div className="absolute left-0 top-11 z-40 min-w-[21rem] rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur">
                <div className="grid gap-1">
                  {siteMenu.map((siteItem) => (
                    <Link
                      key={siteItem.href}
                      href={siteItem.href}
                      className="rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsAboutMenuOpen(false)}
                    >
                      {siteItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Button asChild variant="ghost" size="sm">
            <Link href="/#contacto">Contactanos</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/registro">Registro</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Login</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-2 xl:hidden">
            <Menu className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
