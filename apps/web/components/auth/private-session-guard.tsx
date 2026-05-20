"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { SessionUser } from "@/lib/auth/session";

export function PrivateSessionGuard({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isActive = true;

    async function verifySession() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!isActive) {
          return;
        }

        if (!response.ok) {
          router.replace("/login");
          router.refresh();
        }
      } catch {
        if (isActive) {
          router.replace("/login");
          router.refresh();
        }
      }
    }

    if (!user) {
      router.replace("/login");
      router.refresh();
      return () => {
        isActive = false;
      };
    }

    void verifySession();

    function handlePageShow() {
      void verifySession();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void verifySession();
      }
    }

    function handlePopState() {
      void verifySession();
    }

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, router, user]);

  return null;
}

