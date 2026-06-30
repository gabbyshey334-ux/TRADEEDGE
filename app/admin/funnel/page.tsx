import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const FUNNEL_STEPS = [
  { eventType: "landing_view", label: "LANDING VIEW" },
  { eventType: "signup_started", label: "SIGNUP STARTED" },
  { eventType: "signup_completed", label: "SIGNUP COMPLETED" },
  { eventType: "first_trade_logged", label: "FIRST TRADE LOGGED" },
  { eventType: "checkout_started", label: "CHECKOUT STARTED" },
  { eventType: "checkout_completed", label: "CHECKOUT COMPLETED" },
] as const;

function formatConversion(current: number, previous: number): string {
  if (previous <= 0) return "0.0%";
  return `${((current / previous) * 100).toFixed(1)}%`;
}

export default async function AdminFunnelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect("/dashboard");
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from("funnel_events")
    .select("event_type, session_id");

  if (error) {
    throw new Error(error.message);
  }

  const sessionsByEvent = new Map<string, Set<string>>();

  for (const row of data ?? []) {
    const eventType =
      typeof row.event_type === "string" ? row.event_type : undefined;
    const sessionId =
      typeof row.session_id === "string" ? row.session_id : undefined;

    if (!eventType || !sessionId) continue;

    const currentSessions = sessionsByEvent.get(eventType) ?? new Set<string>();
    currentSessions.add(sessionId);
    sessionsByEvent.set(eventType, currentSessions);
  }

  const rows = FUNNEL_STEPS.map((step, index) => {
    const count = sessionsByEvent.get(step.eventType)?.size ?? 0;
    const previousCount =
      index > 0
        ? sessionsByEvent.get(FUNNEL_STEPS[index - 1].eventType)?.size ?? 0
        : count;

    return {
      ...step,
      count,
      conversion: index === 0 ? "100.0%" : formatConversion(count, previousCount),
    };
  });

  return (
    <main className="min-h-screen bg-[#06080d] px-6 py-10 text-[#e8edf5]">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-[#1c2235] bg-[#0c0f17] p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#00e5b0]">
            Funnel Analytics
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-[#e8edf5]">
            Landing To Revenue Funnel
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#8892a4]">
            Distinct session counts for each funnel step from first visit through
            checkout completion.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
          <div className="grid grid-cols-[minmax(0,1.6fr)_auto_auto] gap-4 border-b border-[#1c2235] px-5 py-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
            <span>Step</span>
            <span>Sessions</span>
            <span>Conversion</span>
          </div>

          {rows.map((row, index) => (
            <div
              key={row.eventType}
              className="grid grid-cols-[minmax(0,1.6fr)_auto_auto] items-center gap-4 border-b border-[#1c2235] px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="font-mono text-[9px] tracking-[0.2em] text-[#4a5568] uppercase">
                  {row.label}
                </div>
                {index > 0 ? (
                  <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-[#4a5568]">
                    {row.conversion} of previous step
                  </div>
                ) : null}
              </div>

              <div className="font-mono text-2xl font-bold tabular-nums text-[#e8edf5]">
                {row.count}
              </div>

              <div
                className={`font-mono text-sm tabular-nums ${
                  index === 0 ? "text-[#8892a4]" : "text-[#8892a4]"
                }`}
              >
                {index === 0 ? "—" : row.conversion}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
