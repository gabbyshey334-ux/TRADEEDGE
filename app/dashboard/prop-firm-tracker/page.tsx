import { PageHeader } from "@/components/PageHeader";
import { requireAuthUser, getUserProfile } from "@/lib/auth/server";
import { PLAN_LIMITS, parsePlan } from "@/lib/plan-limits";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { PropFirmClient } from "@/components/PropFirmClient";
import { getPropFirmAccounts } from "@/lib/actions/prop-firms";

export const dynamic = "force-dynamic";

export default async function PropFirmTrackerPage() {
  const user = await requireAuthUser();
  const profile = await getUserProfile(user.id);
  const plan = parsePlan(profile?.plan) ?? "starter";
  const unlocked = plan !== "starter" && PLAN_LIMITS[plan].propFirmTracker;

  const accountsResult = unlocked
    ? await getPropFirmAccounts()
    : { data: [], error: null };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Prop Firm Tracker"
        eyebrow="Workspace"
        subtitle="Track evaluations, payouts, and firm rules in one place"
      />

      <div className="dashboard-page">
        {unlocked ? (
          <PropFirmClient
            initialAccounts={accountsResult.data ?? []}
            initialError={accountsResult.error}
          />
        ) : (
          <div className="relative min-h-[420px]">
            <LockedFeaturePanel message="Prop Firm Tracker is available on Pro and Elite plans" />
          </div>
        )}
      </div>
    </div>
  );
}
