import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAppUrl } from "@/lib/app-url";
import { createStripePortalSession } from "@/lib/stripe-billing";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = await resolveAppUrl();
    const { url } = await createStripePortalSession({
      supabase,
      userId: user.id,
      appUrl,
    });

    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
