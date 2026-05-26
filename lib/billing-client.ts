import type { BillingActionResult } from "@/lib/actions/billing";
import {
  PAYMENT_NOT_CONFIGURED_ERROR,
  PAYMENT_COMING_SOON_MESSAGE,
} from "@/lib/billing-messages";

export function handleBillingActionResult(
  result: BillingActionResult,
  handlers: {
    onSuccess: (url: string) => void;
    onNotConfigured?: () => void;
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

  handlers.onError(result.error);
}

export { PAYMENT_COMING_SOON_MESSAGE };
