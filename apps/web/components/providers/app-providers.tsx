"use client";

import type { ReactNode } from "react";

import { FeedbackProvider } from "./feedback-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </ThemeProvider>
  );
}
