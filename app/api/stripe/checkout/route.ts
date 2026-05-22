import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { planToPriceId } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";

export const runtime = "nodejs";

const VALID_PLANS: Plan[] = ["starter", "pro", "elite"];

function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && (VALID_PLANS as string[]).includes(value);
}

function resolveAppUrl(request: NextRequest): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  try {
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
    const plan: Plan = body.plan;

    const priceId = planToPriceId(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID for plan "${plan}" is not configured.` },
        { status: 500 }
      );
    }

    const appUrl = resolveAppUrl(request);
    if (!appUrl) {
      return NextResponse.json(
        { error: "Could not determine app URL for checkout redirects." },
        { status: 500 }
      );
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    let customerId: string | null = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? undefined,
        metadata: { supabase_uid: user.id },
      });
      customerId = customer.id;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/dashboard`,
      allow_promotion_codes: true,
      metadata: { supabase_uid: user.id },
      subscription_data: {
        metadata: { supabase_uid: user.id },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
