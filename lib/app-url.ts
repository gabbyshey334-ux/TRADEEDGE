import { headers } from "next/headers";

/** Canonical app origin for Stripe redirects and internal links. */
export async function resolveAppUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}`;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  throw new Error(
    "App URL is not configured. Set NEXT_PUBLIC_APP_URL in Vercel environment variables."
  );
}

export function resolveAppUrlFromRequest(request: {
  headers: { get(name: string): string | null };
}): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}`;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  throw new Error(
    "Could not determine app URL for checkout redirects."
  );
}
