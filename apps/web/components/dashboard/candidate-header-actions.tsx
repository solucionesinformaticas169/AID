"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CandidateHeaderActions() {
  const pathname = usePathname();
  const isOpportunitiesPage = pathname === "/candidato/oportunidades";
  const isResumePage = pathname === "/candidato/hoja-de-vida";

  return (
    <>
      {isOpportunitiesPage ? (
        <>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/candidato">
              <ArrowLeft className="mr-2 size-4" />
              Volver al panel
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("candidate-opportunities:refresh"));
            }}
          >
            <RefreshCw className="mr-2 size-4" />
            Refrescar ofertas
          </Button>
        </>
      ) : isResumePage ? (
        <>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/candidato">
              <ArrowLeft className="mr-2 size-4" />
              Volver al panel
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/candidato/oportunidades">
              Encuentra oportunidades
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/candidato/hoja-de-vida">Hoja de vida</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/candidato/oportunidades">
              Encuentra oportunidades
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 size-4" />
            Refrescar panel
          </Button>
        </>
      )}
    </>
  );
}
