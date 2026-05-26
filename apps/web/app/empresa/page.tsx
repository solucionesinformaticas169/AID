import { CompanyDashboardClient } from "@/components/dashboard/company-dashboard-client";
import { getServerSession } from "@/lib/auth/session";

export default async function CompanyDashboardPage() {
  const session = await getServerSession();

  return <CompanyDashboardClient session={session} />;
}
