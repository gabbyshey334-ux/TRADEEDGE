"use server";

import { headers } from "next/headers";
import type { Plan } from "@/lib/types";

/**
 * Resolve an absolute origin for the current request. We prefer
 * NEXT_PUBLIC_APP_URL (the canonical app URL) and fall back to the
 * incoming request headers so this works in preview deployments.
 */
async function resolveOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) {
    throw new Error("Could not determine request origin.");
  }
  return `${proto}://${host}`;
}

async function forwardCookieHeader(): Promise<string> {
  const h = await headers();
  return h.get("cookie") ?? "";
}

export async function createCheckoutSession(
  plan: Plan
): Promise<{ url: string }> {
  const origin = await resolveOrigin();
  const cookie = await forwardCookieHeader();

  const res = await fetch(`${origin}/api/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body: JSON.stringify({ plan }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Failed to create checkout session.");
  }
  return { url: data.url };
}

export async function createPortalSession(): Promise<{ url: string }> {
  const origin = await resolveOrigin();
  const cookie = await forwardCookieHeader();

  const res = await fetch(`${origin}/api/stripe/portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Failed to open billing portal.");
  }
  return { url: data.url };
}
