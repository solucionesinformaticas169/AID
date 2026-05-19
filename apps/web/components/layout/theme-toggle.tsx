"use client";

import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="outline" size="sm" onClick={toggleTheme}>
      {theme === "dark" ? <SunMedium className="mr-2 size-4" /> : <MoonStar className="mr-2 size-4" />}
      {theme === "dark" ? "Claro" : "Oscuro"}
    </Button>
  );
}
