import { PageHeader } from "@/components/PageHeader";
import { requireAuthUser, getUserProfile } from "@/lib/auth/server";
import { PLAN_LIMITS, parsePlan } from "@/lib/plan-limits";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { CongressTradesTable } from "@/components/CongressTradesTable";

export const dynamic = "force-dynamic";

export default async function CongressionalTradesPage() {
  const user = await requireAuthUser();
  const profile = await getUserProfile(user.id);
  const plan = parsePlan(profile?.plan) ?? "starter";
  const unlocked = plan !== "starter" && PLAN_LIMITS[plan].congressionalTrades;

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Congressional Trades"
        eyebrow="Research"
        subtitle="US congressional stock disclosures (STOCK Act)"
      />

      <div className="dashboard-page">
        {unlocked ? (
          <CongressTradesTable />
        ) : (
          <div className="relative min-h-[420px]">
            <LockedFeaturePanel message="Congressional Trades Feed is available on Pro and Elite plans" />
          </div>
        )}
      </div>
    </div>
  );
}
