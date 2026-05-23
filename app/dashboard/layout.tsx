import { DashboardShell } from "@/components/DashboardShell";
import { ensureAdminAccess } from "@/lib/actions/admin";
import { getSidebarUser } from "@/lib/auth/server";

/** Auth + Supabase — must not run at build time without env vars. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureAdminAccess();
  const sidebarUser = await getSidebarUser();

  return <DashboardShell user={sidebarUser}>{children}</DashboardShell>;
}
