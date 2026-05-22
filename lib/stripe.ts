import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it in Vercel environment variables."
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2024-04-10",
      typescript: true,
    });
  }

  return stripeClient;
}

/** @deprecated Use getStripe() — kept for webhook route compatibility */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});
