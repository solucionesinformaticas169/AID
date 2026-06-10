"use client";

import { useEffect, useMemo, useState } from "react";

import { getPublicCompanyLogos, type PublicCompanyLogo } from "@/lib/api/companies";

type CarouselLogoItem = {
  instanceKey: string;
  company: PublicCompanyLogo;
};

export function CompanyLogoCarousel() {
  const [logos, setLogos] = useState<PublicCompanyLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const payload = await getPublicCompanyLogos();
        if (isMounted) {
          setLogos(payload);
        }
      } catch {
        if (isMounted) {
          setLogos([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const loopedLogos = useMemo<CarouselLogoItem[]>(() => {
    return logos.length > 1
      ? [...logos, ...logos].map((company, index) => ({
          instanceKey: `${company.id}-${index}`,
          company,
        }))
      : logos.map((company) => ({
          instanceKey: company.id,
          company,
        }));
  }, [logos]);

  if (isLoading || logos.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/85 px-5 py-5 shadow-[0_14px_32px_rgba(33,29,8,0.05)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Empresas presentes en AIDLABORAL</p>
          <h3 className="text-lg font-semibold text-foreground">Marcas que ya forman parte del ecosistema</h3>
        </div>
      </div>

      {logos.length === 1 ? (
        <SingleCompanyLogoLoop company={logos[0]} />
      ) : (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-card via-card/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-card via-card/80 to-transparent" />
          <div className="flex min-w-max animate-[company-marquee_34s_linear_infinite] gap-4">
            {loopedLogos.map((item) => (
              <CompanyLogoBadge key={item.instanceKey} company={item.company} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SingleCompanyLogoLoop({ company }: { company: PublicCompanyLogo }) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-card via-card/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-card via-card/80 to-transparent" />
      <div className="flex min-w-max animate-[company-marquee_22s_linear_infinite]">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={`${company.id}-single-${index}`}
            className="flex min-w-[min(1000px,calc(100vw-7rem))] justify-center"
          >
            <CompanyLogoBadge company={company} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanyLogoBadge({ company }: { company: PublicCompanyLogo }) {
  return (
    <div
      className="flex h-[96px] min-w-[240px] items-center justify-center px-4"
      title={company.legalName}
    >
      <img
        src={`/api/public/company-logos/${company.id}`}
        alt={`Logo de ${company.name}`}
        className="max-h-20 w-auto max-w-[220px] object-contain"
        loading="lazy"
      />
    </div>
  );
}
