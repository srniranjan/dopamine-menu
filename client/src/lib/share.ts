import { capture } from "@/lib/posthog";

const SHARE_BASE_URL = "https://dopamine.menu/";
const SHARE_TITLE = "Dopamine Menu";
const SHARE_TEXT = "A little menu to help you pick what to do next. Try it:";

export type ShareSource = "settings" | "celebration";

type ToastFn = (opts: { title: string; description?: string }) => void;

function buildShareUrl(source: ShareSource): string {
  const url = new URL(SHARE_BASE_URL);
  url.searchParams.set("ref", source);
  return url.toString();
}

export async function shareApp(
  toast: ToastFn | undefined,
  source: ShareSource,
): Promise<void> {
  const shareUrl = buildShareUrl(source);
  const shareData = {
    title: SHARE_TITLE,
    text: SHARE_TEXT,
    url: shareUrl,
  };

  let mechanism: "native" | "clipboard" | "unavailable" = "unavailable";
  let dismissed = false;
  let succeeded = false;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    mechanism = "native";
    try {
      await navigator.share(shareData);
      succeeded = true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        dismissed = true;
      } else {
        // Fall through to clipboard fallback on other errors.
        mechanism = "clipboard";
      }
    }
  } else {
    mechanism = "clipboard";
  }

  if (!succeeded && !dismissed && mechanism === "clipboard") {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast?.({
        title: "Link copied!",
        description: "Paste it anywhere to share.",
      });
      succeeded = true;
    } catch {
      toast?.({
        title: "Couldn't share",
        description: shareUrl,
      });
    }
  }

  capture("share_clicked", {
    source,
    mechanism,
    dismissed,
    succeeded,
  });
}
