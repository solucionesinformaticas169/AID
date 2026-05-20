"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CandidateHeaderActions() {
  const pathname = usePathname();
  const isOpportunitiesPage = pathname === "/candidato/oportunidades";

  return (
    <>
      {isOpportunitiesPage ? (
        <>
          <Button variant="outline" asChild>
            <Link href="/candidato">
              <ArrowLeft className="mr-2 size-4" />
              Volver al panel
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("candidate-opportunities:refresh"));
            }}
          >
            <RefreshCw className="mr-2 size-4" />
            Refrescar ofertas
          </Button>
        </>
      ) : (
        <>
          <Button asChild>
            <Link href="/candidato/oportunidades">
              Encuentra oportunidades
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 size-4" />
            Refrescar panel
          </Button>
        </>
      )}
    </>
  );
}
