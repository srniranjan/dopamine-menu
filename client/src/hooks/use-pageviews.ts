import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { capture, getInitialAttribution } from "@/lib/posthog";

export function usePageViews(): void {
  const [location] = useLocation();
  const lastReportedRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastReportedRef.current === location) return;
    lastReportedRef.current = location;

    const url = typeof window !== "undefined" ? window.location.href : location;
    const attribution = getInitialAttribution();

    capture("$pageview", {
      $current_url: url,
      path: location,
      ...attribution,
    });
  }, [location]);
}
