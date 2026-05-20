"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useFeedback } from "@/components/providers/feedback-provider";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  variant = "outline",
  className,
}: {
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useFeedback();

  async function handleLogout() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "No se pudo cerrar la sesion.");
      }

      window.location.replace("/login");
    } catch (error) {
      showToast({
        title: "No se pudo cerrar la sesion",
        description: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      disabled={isLoading}
      onClick={() => void handleLogout()}
    >
      <LogOut className="mr-2 size-4" />
      {isLoading ? "Cerrando..." : "Cerrar sesion"}
    </Button>
  );
}
