import { DashboardShell } from "@/components/DashboardShell";
import { getSidebarUser } from "@/lib/auth/server";

/** Auth + Supabase — must not run at build time without env vars. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarUser = await getSidebarUser();

  return <DashboardShell user={sidebarUser}>{children}</DashboardShell>;
}
