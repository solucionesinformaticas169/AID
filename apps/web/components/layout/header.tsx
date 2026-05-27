"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteMenu } from "@/lib/mock-data";

export function Header() {
  const pathname = usePathname();
  const [isAboutMenuOpen, setIsAboutMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileAboutMenuOpen, setIsMobileAboutMenuOpen] = useState(false);
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
        setIsMobileMenuOpen(false);
        setIsMobileAboutMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setIsAboutMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileAboutMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  if (isPrivateRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="transition hover:opacity-95">
          <BrandLogo compact />
        </Link>
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
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div className="xl:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0"
              aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
            >
              {isMobileMenuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <div className="xl:hidden">
          <button
            type="button"
            aria-label="Cerrar menu"
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsMobileAboutMenuOpen(false);
            }}
          />
          <div className="fixed inset-x-4 top-[5.5rem] z-40 max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain rounded-3xl border border-border/70 bg-card/95 p-4 shadow-xl backdrop-blur">
            <div className="grid gap-2">
              <Button asChild variant="ghost" className="justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/">Home</Link>
              </Button>

              <div className="rounded-2xl border border-border/70 bg-background/50 p-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setIsMobileAboutMenuOpen((current) => !current)}
                  aria-expanded={isMobileAboutMenuOpen}
                >
                  <span>Nosotros</span>
                  <ChevronDown
                    className={`size-4 transition ${isMobileAboutMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isMobileAboutMenuOpen ? (
                  <div className="mt-2 grid gap-1">
                    {siteMenu.map((siteItem) => (
                      <Link
                        key={siteItem.href}
                        href={siteItem.href}
                        className="rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsMobileAboutMenuOpen(false);
                        }}
                      >
                        {siteItem.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <Button asChild variant="ghost" className="justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/#contacto">Contactanos</Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/registro">Registro</Link>
              </Button>
              <Button asChild className="justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
