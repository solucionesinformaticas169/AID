import type { ReactNode } from "react";

import { CandidateLayoutShell } from "@/components/dashboard/candidate-layout-shell";
import { getServerSession } from "@/lib/auth/session";

export default async function CandidateLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();

  return <CandidateLayoutShell user={session}>{children}</CandidateLayoutShell>;
}
