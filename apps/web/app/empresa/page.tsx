import { CompanyDashboardEntry } from "@/components/dashboard/company-dashboard-entry";
import { getServerSession } from "@/lib/auth/session";

export default async function CompanyDashboardPage() {
  const session = await getServerSession();

  return <CompanyDashboardEntry session={session} />;
}
