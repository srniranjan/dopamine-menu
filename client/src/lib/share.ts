const SHARE_URL = "https://dopamine.menu/";
const SHARE_TITLE = "Dopamine Menu";
const SHARE_TEXT = "A little menu to help you pick what to do next. Try it:";

type ToastFn = (opts: { title: string; description?: string }) => void;

export async function shareApp(toast?: ToastFn): Promise<void> {
  const shareData = {
    title: SHARE_TITLE,
    text: SHARE_TEXT,
    url: SHARE_URL,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      // AbortError = user dismissed the share sheet, treat as success-no-op.
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Fall through to clipboard fallback on other errors.
    }
  }

  try {
    await navigator.clipboard.writeText(SHARE_URL);
    toast?.({
      title: "Link copied!",
      description: "Paste it anywhere to share.",
    });
  } catch {
    toast?.({
      title: "Couldn't share",
      description: SHARE_URL,
    });
  }
}
