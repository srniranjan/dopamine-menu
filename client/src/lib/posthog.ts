import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
  "https://us.i.posthog.com";

let initialized = false;

const ATTRIBUTION_PARAMS = [
  "ref",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

type AttributionMap = Partial<Record<(typeof ATTRIBUTION_PARAMS)[number], string>>;

function readAttributionFromUrl(): AttributionMap {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: AttributionMap = {};
  for (const key of ATTRIBUTION_PARAMS) {
    const v = params.get(key);
    if (v) out[key] = v;
  }
  return out;
}

export function isPosthogEnabled(): boolean {
  return initialized;
}

export function initPostHog(): void {
  if (initialized) return;
  if (!POSTHOG_KEY) {
    // No key configured — silently no-op so dev keeps working.
    if (import.meta.env.DEV) {
      console.info(
        "[posthog] VITE_POSTHOG_KEY not set; analytics disabled.",
      );
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // We fire $pageview manually on Wouter route changes; the SPA router
    // means autocapture's built-in pageview only catches the first load.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    person_profiles: "identified_only",
    persistence: "localStorage+cookie",
    loaded: (ph) => {
      // Stash first-touch attribution so we can include it on identify().
      const attribution = readAttributionFromUrl();
      if (Object.keys(attribution).length > 0) {
        ph.register(attribution);
      }
    },
  });

  initialized = true;
}

export function capture(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identify(
  distinctId: string,
  properties?: Record<string, unknown>,
  setOnce?: Record<string, unknown>,
): void {
  if (!initialized) return;
  posthog.identify(distinctId, properties, setOnce);
}

export function reset(): void {
  if (!initialized) return;
  posthog.reset();
}

export function getInitialAttribution(): AttributionMap {
  return readAttributionFromUrl();
}
