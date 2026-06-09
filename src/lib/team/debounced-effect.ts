export const ACTIVITY_TAB_FETCH_DEBOUNCE_MS = 300;

export function debounceEffect(
  callback: () => void,
  delayMs: number = ACTIVITY_TAB_FETCH_DEBOUNCE_MS,
): () => void {
  const timeoutId = window.setTimeout(callback, delayMs);

  return () => {
    window.clearTimeout(timeoutId);
  };
}
