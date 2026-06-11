import { trackAnalyticsEvent } from "./track";

const PAGE_VIEW_DEDUPE_MS = 2_500;

type PageViewDedupeRecord = {
  path: string;
  at: number;
};

let lastPageViewRecord: PageViewDedupeRecord | null = null;

export function shouldSkipDuplicatePageView(path: string): boolean {
  const now = Date.now();

  if (
    lastPageViewRecord &&
    lastPageViewRecord.path === path &&
    now - lastPageViewRecord.at < PAGE_VIEW_DEDUPE_MS
  ) {
    return true;
  }

  lastPageViewRecord = { path, at: now };
  return false;
}

export function trackPageViewed(path: string): void {
  if (shouldSkipDuplicatePageView(path)) {
    return;
  }

  trackAnalyticsEvent({
    eventName: "page_viewed",
    path
  });
}

export function resetPageViewDedupeForTests(): void {
  lastPageViewRecord = null;
}
