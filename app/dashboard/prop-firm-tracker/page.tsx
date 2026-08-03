import { requireAuthUser, getUserProfile } from "@/lib/auth/server";
import { PLAN_LIMITS, getEffectiveAccessPlan } from "@/lib/plan-limits";
import { BlurredFeaturePreview } from "@/components/BlurredFeaturePreview";
import { PropFirmClient } from "@/components/PropFirmClient";
import { PropFirmPreviewSample } from "@/components/PropFirmPreviewSample";
import { getPropFirmAccounts } from "@/lib/actions/prop-firms";

export const dynamic = "force-dynamic";

export default async function PropFirmTrackerPage() {
  const user = await requireAuthUser();
  const profile = await getUserProfile(user.id);
  const plan = getEffectiveAccessPlan({
    plan: profile?.plan,
    trial_ends_at: profile?.trial_ends_at,
  });
  const unlocked = plan !== "starter" && PLAN_LIMITS[plan].propFirmTracker;

  const accountsResult = unlocked
    ? await getPropFirmAccounts()
    : { data: [], error: null };

  return (
    <div className="animate-fadeIn">
      <div className="border-b border-[#1c2235] pb-6 mb-6">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#4a5568] uppercase">
          WORKSPACE
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold text-[#e8edf5]">
          Prop Firm Tracker
        </h1>
        <p className="mt-2 font-mono text-[11px] text-[#4a5568]">
          Track evaluations, payouts, and firm rules in one place
        </p>
      </div>

      <div className="dashboard-page">
        {unlocked ? (
          <PropFirmClient
            initialAccounts={accountsResult.data ?? []}
            initialError={accountsResult.error}
            plan={plan}
          />
        ) : (
          <BlurredFeaturePreview
            targetPlan="pro"
            featureName="Prop Firm Tracker"
            featureDescription="Track challenges, drawdowns, and readiness across firms — unlock the full tracker on Pro."
            minHeight={420}
            badge="SAMPLE"
          >
            <PropFirmPreviewSample />
          </BlurredFeaturePreview>
        )}
      </div>
    </div>
  );
}
