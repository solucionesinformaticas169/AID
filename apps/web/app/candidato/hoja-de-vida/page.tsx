import { CandidateResumeClient } from "@/components/dashboard/candidate-resume-client";
import { getServerSession } from "@/lib/auth/session";

export default async function CandidateResumePage() {
  const session = await getServerSession();

  return <CandidateResumeClient user={session} />;
}
