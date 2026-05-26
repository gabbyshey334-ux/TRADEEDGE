import type { BillingActionResult } from "@/lib/actions/billing";
import {
  MANUAL_PLAN_BILLING_MESSAGE,
  PAYMENT_NOT_CONFIGURED_ERROR,
  PAYMENT_COMING_SOON_MESSAGE,
} from "@/lib/billing-messages";

export function handleBillingActionResult(
  result: BillingActionResult,
  handlers: {
    onSuccess: (url: string) => void;
    onNotConfigured?: () => void;
    onManualPlan?: () => void;
    onError: (message: string) => void;
  }
): void {
  if (result.ok) {
    handlers.onSuccess(result.url);
    return;
  }

  if (
    result.code === "not_configured" ||
    result.error === PAYMENT_NOT_CONFIGURED_ERROR
  ) {
    handlers.onNotConfigured?.();
    return;
  }

  if (
    result.code === "no_customer" ||
    result.error === MANUAL_PLAN_BILLING_MESSAGE
  ) {
    handlers.onManualPlan?.();
    return;
  }

  handlers.onError(result.error);
}

export {
  MANUAL_PLAN_BILLING_MESSAGE,
  PAYMENT_COMING_SOON_MESSAGE,
};
