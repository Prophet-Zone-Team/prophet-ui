import { resetPageViewDedupeForTests } from "./page-view";

const seenDedupeKeys = new Set<string>();
let impressionIndex = 0;

export function nextImpressionIndex(): number {
  impressionIndex += 1;
  return impressionIndex;
}

export function hasSeenDedupeKey(key: string): boolean {
  return seenDedupeKeys.has(key);
}

export function markDedupeKeySeen(key: string): void {
  seenDedupeKeys.add(key);
}

export function resetAnalyticsTrackingContextForTests(): void {
  seenDedupeKeys.clear();
  impressionIndex = 0;
  resetPageViewDedupeForTests();
}
