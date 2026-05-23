import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAppUrlFromRequest } from "@/lib/app-url";
import { createStripeCheckoutSession } from "@/lib/stripe-billing";
import type { Plan } from "@/lib/types";

export const runtime = "nodejs";

const VALID_PLANS: Plan[] = ["starter", "pro", "elite"];

const PAYMENT_NOT_CONFIGURED_ERROR =
  "Payment system is not yet configured. Please contact support.";

function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && (VALID_PLANS as string[]).includes(value);
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { error: PAYMENT_NOT_CONFIGURED_ERROR },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { plan?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!isPlan(body.plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be one of starter, pro, elite." },
        { status: 400 }
      );
    }

    const appUrl = resolveAppUrlFromRequest(request);
    const { url } = await createStripeCheckoutSession({
      supabase,
      user,
      plan: body.plan,
      appUrl,
    });

    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
