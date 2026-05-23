import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  applySubscriptionToUser,
  updateProfilePlan,
  upsertSubscriptionRow,
} from "@/lib/billing/subscription-sync";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Stripe webhook handler.
 *
 * IMPORTANT — raw body handling:
 *   `stripe.webhooks.constructEvent` requires the exact bytes Stripe sent,
 *   verbatim. In the Next.js App Router, the body is NEVER auto-parsed —
 *   it's only parsed if you explicitly call `request.json()` /
 *   `request.formData()`. We call `request.text()` below, which yields the
 *   raw payload untouched.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveSupabaseUid(
  customerId: string,
  metadataUid: string | undefined
): Promise<string | null> {
  if (metadataUid) return metadataUid;

  const supabase = getServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (data?.id) return data.id as string;

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
    return;
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
  await applySubscriptionToUser({ userId, subscription });
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

  await applySubscriptionToUser({ userId, subscription });
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

  await upsertSubscriptionRow({
    userId,
    subscription,
    plan: "starter",
  });

  await updateProfilePlan({
    userId,
    patch: {
      plan: "starter",
      sub_status: "canceled",
      stripe_sub_id: null,
      stripe_customer_id: customerId,
    },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

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
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.updated":
      case "customer.subscription.created":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error(
      `[stripe-webhook] handler error for event ${event.id} (${event.type}):`,
      err
    );
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}
