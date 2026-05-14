export const WATCHLIST_STORAGE_KEY = "world-cup-prediction-terminal:watchlist";

export function readStoredWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredWatchlist(teamIds: string[]): void {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(teamIds));
}
