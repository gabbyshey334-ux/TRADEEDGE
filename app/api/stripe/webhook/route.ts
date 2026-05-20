import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { priceIdToPlan } from "@/lib/plan-limits";
import type { Plan } from "@/lib/types";

/**
 * Stripe webhook handler.
 *
 * IMPORTANT — raw body handling:
 *   `stripe.webhooks.constructEvent` requires the exact bytes Stripe sent,
 *   verbatim. In the Next.js App Router, the body is NEVER auto-parsed —
 *   it's only parsed if you explicitly call `request.json()` /
 *   `request.formData()`. We call `request.text()` below, which yields the
 *   raw payload untouched.
 *
 *   Do NOT add the Pages-Router-era `export const config = { api: { bodyParser: false } }`
 *   here — App Router rejects it at build time, and it is unnecessary.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service-role env vars are missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toIsoOrNull(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds || Number.isNaN(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

async function resolveSupabaseUid(
  customerId: string,
  metadataUid: string | undefined
): Promise<string | null> {
  if (metadataUid) return metadataUid;

  // Fallback 1: look up by stripe_customer_id in profiles (set on first checkout).
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (data?.id) return data.id as string;

  // Fallback 2: pull the customer from Stripe and read its metadata.
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      const uid = (customer.metadata as Record<string, string> | undefined)
        ?.supabase_uid;
      if (uid) return uid;
    }
  } catch {
    /* ignore */
  }

  return null;
}

async function upsertSubscriptionRow(args: {
  userId: string;
  subscription: Stripe.Subscription;
  plan: Plan;
}) {
  const { userId, subscription, plan } = args;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id,
        stripe_subscription_id: subscription.id,
        plan,
        plan_status: subscription.status,
        current_period_end: toIsoOrNull(subscription.current_period_end),
      },
      { onConflict: "stripe_subscription_id" }
    );

  if (error) {
    throw new Error(`subscriptions upsert failed: ${error.message}`);
  }
}

async function updateProfile(args: {
  userId: string;
  patch: Partial<{
    plan: Plan;
    stripe_customer_id: string;
    stripe_sub_id: string | null;
    sub_status: string;
  }>;
}) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update(args.patch)
    .eq("id", args.userId);
  if (error) {
    throw new Error(`profiles update failed: ${error.message}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  if (!customerId || !subscriptionId) {
    return; // not a subscription checkout — nothing to do
  }

  const metadataUid = (session.metadata as Record<string, string> | null)
    ?.supabase_uid;
  const userId = await resolveSupabaseUid(customerId, metadataUid);
  if (!userId) {
    throw new Error(
      `Could not resolve supabase_uid for checkout session ${session.id}`
    );
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceIdToPlan(priceId);
  if (!plan) {
    throw new Error(`Unknown price id "${priceId}" on subscription ${subscription.id}`);
  }

  await upsertSubscriptionRow({ userId, subscription, plan });
  await updateProfile({
    userId,
    patch: {
      plan,
      stripe_customer_id: customerId,
      stripe_sub_id: subscription.id,
      sub_status: subscription.status,
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const metadataUid = (subscription.metadata as Record<string, string> | null)
    ?.supabase_uid;
  const userId = await resolveSupabaseUid(customerId, metadataUid);
  if (!userId) {
    throw new Error(
      `Could not resolve supabase_uid for subscription ${subscription.id}`
    );
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceIdToPlan(priceId);
  if (!plan) {
    throw new Error(
      `Unknown price id "${priceId}" on subscription ${subscription.id}`
    );
  }

  await upsertSubscriptionRow({ userId, subscription, plan });

  // If the subscription has been canceled/unpaid/etc, drop the user back to starter
  // so they lose access. Otherwise, reflect the new plan.
  const downgradedStatuses = new Set([
    "canceled",
    "incomplete_expired",
    "unpaid",
  ]);
  const effectivePlan: Plan = downgradedStatuses.has(subscription.status)
    ? "starter"
    : plan;

  await updateProfile({
    userId,
    patch: {
      plan: effectivePlan,
      stripe_customer_id: customerId,
      stripe_sub_id: subscription.id,
      sub_status: subscription.status,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const metadataUid = (subscription.metadata as Record<string, string> | null)
    ?.supabase_uid;
  const userId = await resolveSupabaseUid(customerId, metadataUid);
  if (!userId) {
    throw new Error(
      `Could not resolve supabase_uid for deleted subscription ${subscription.id}`
    );
  }

  const supabase = getServiceClient();
  const { error: subErr } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan: "starter",
        plan_status: "canceled",
        current_period_end: toIsoOrNull(subscription.current_period_end),
      },
      { onConflict: "stripe_subscription_id" }
    );
  if (subErr) {
    throw new Error(`subscriptions cancel upsert failed: ${subErr.message}`);
  }

  await updateProfile({
    userId,
    patch: {
      plan: "starter",
      sub_status: "canceled",
      stripe_sub_id: null,
    },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Misconfiguration — surface a 500 so it's visible in Stripe's dashboard.
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // CRITICAL: read the raw body. Do NOT use request.json() — it would
  // re-serialize the payload and break signature verification.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.created":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // Ignore everything else, but still 200 so Stripe stops retrying.
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    // Log so it's visible in server logs / Vercel runtime logs, but still
    // return 200 so Stripe does not enter an infinite retry storm for bugs
    // on our end. Stripe's dashboard will show the success; we monitor
    // application logs for handler failures.
    console.error(
      `[stripe-webhook] handler error for event ${event.id} (${event.type}):`,
      err
    );
    return NextResponse.json(
      { received: true, warning: "handler_error_logged" },
      { status: 200 }
    );
  }
}
