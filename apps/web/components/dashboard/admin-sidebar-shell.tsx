"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings2,
  Shield,
  Users2,
} from "lucide-react";

import { PrivateSessionGuard } from "@/components/auth/private-session-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function isSuperAdmin(user: SessionUser | null) {
  return user?.email?.toLowerCase() === "superadmin@aidlaboral.com";
}

export function AdminSidebarShell({
  title,
  description,
  user,
  children,
}: {
  title: string;
  description: string;
  user: SessionUser | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const superAdmin = isSuperAdmin(user);
  const sidebarItems = [
    { href: "/admin", label: "Resumen", icon: LayoutDashboard },
    { href: "/admin#a-usuarios", label: "Usuarios", icon: Users2 },
    { href: "/admin#a-empresas", label: "Empresas", icon: Building2 },
    { href: "/admin#a-vacantes", label: "Vacantes", icon: BriefcaseBusiness },
    { href: "/admin#a-postulaciones", label: "Postulaciones", icon: FileCheck2 },
    { href: "/admin#a-pagos", label: "Pagos y suscripciones", icon: CreditCard },
    { href: "/admin#a-facturas", label: "Facturas", icon: Receipt },
    { href: "/admin#a-documentos", label: "Documentos", icon: FileText },
    ...(superAdmin
      ? [
          { href: "/admin#a-auditoria", label: "Auditoria", icon: Shield },
          { href: "/admin#a-seguridad", label: "Seguridad", icon: Bell },
          { href: "/admin#a-configuracion", label: "Configuracion", icon: Settings2 },
        ]
      : []),
  ];

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.includes("#")) {
      return;
    }

    event.preventDefault();

    const [basePath, hash] = href.split("#");
    const targetId = hash ?? "";

    if (pathname !== basePath) {
      router.push(href);
      return;
    }

    const target = document.getElementById(targetId);

    if (!target) {
      router.push(href);
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - 104;
    window.history.replaceState(null, "", href);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr] lg:px-6">
      <PrivateSessionGuard user={user} />
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1">
        <Card className="overflow-hidden rounded-[1.75rem] border-border/70 bg-card/90 shadow-[0_18px_44px_rgba(33,29,8,0.06)]">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <BrandLogo compact />
              <Badge variant="secondary">AdministradorSistema</Badge>
              <div>
                <h1 className="text-xl font-semibold leading-tight">{title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sesion activa</p>
              <p className="mt-3 font-medium">{user?.email ?? "admin@aidlaboral.com"}</p>
              <p className="mt-1 text-sm text-muted-foreground">Rol: {user?.role ?? "SYSTEM_ADMIN"}</p>
            </div>

            <LogoutButton className="w-full justify-center" />

            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Menu administrativo</p>
                <p className="mt-1 text-sm text-muted-foreground">Accesos directos del perfil administrador.</p>
              </div>

              <nav className="grid gap-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin" ? pathname === "/admin" : pathname === "/admin";

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(event) => handleNavigation(event, item.href)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                        isActive
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/60 bg-background/40 text-foreground hover:bg-background/70",
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </CardContent>
        </Card>
      </aside>

      <section>{children}</section>
    </main>
  );
}
