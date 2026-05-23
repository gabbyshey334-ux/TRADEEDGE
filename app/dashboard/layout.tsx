import { Suspense } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { ensureAdminAccess } from "@/lib/actions/admin";
import { getSidebarUser, requireAuthUser } from "@/lib/auth/server";
import { syncSubscriptionIfNeeded } from "@/lib/auth/sync-subscription";

/** Auth + Supabase — must not run at build time without env vars. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthUser();
  await syncSubscriptionIfNeeded(user.id);
  await ensureAdminAccess();
  const sidebarUser = await getSidebarUser();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06080d] lg:ml-[232px]">{children}</div>
      }
    >
      <DashboardShell user={sidebarUser}>{children}</DashboardShell>
    </Suspense>
  );
}
