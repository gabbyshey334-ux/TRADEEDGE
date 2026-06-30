"use client";

import { useEffect } from "react";
import { trackFunnelEvent } from "@/lib/funnel-track";

export function LandingViewTracker() {
  useEffect(() => {
    void trackFunnelEvent("landing_view");
  }, []);

  return null;
}
