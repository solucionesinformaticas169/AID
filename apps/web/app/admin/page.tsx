import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client";
import { getServerSession } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  const session = await getServerSession();

  return <AdminDashboardClient user={session} />;
}
