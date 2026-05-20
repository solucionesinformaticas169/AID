import { AdminAuditClient } from "@/components/dashboard/admin-audit-client";
import { getServerSession } from "@/lib/auth/session";

export default async function AdminAuditPage() {
  const session = await getServerSession();

  return <AdminAuditClient user={session} />;
}
