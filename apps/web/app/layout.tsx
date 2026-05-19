import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, IBM_Plex_Sans } from "next/font/google";

import { Header } from "@/components/layout/header";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AIDLABORAL S.A.S.",
  description: "Base inicial de plataforma web de empleos y talento humano.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${plex.variable} min-h-screen`}>
        <AppProviders>
          <Header />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
