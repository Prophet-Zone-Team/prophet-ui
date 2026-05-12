import type { MockBid } from "../../types/market";

export const BID_STORAGE_KEY = "world-cup-prediction-terminal:mock-bids";
export const WATCHLIST_STORAGE_KEY = "world-cup-prediction-terminal:watchlist";

export function readStoredBids(): MockBid[] {
  try {
    const raw = localStorage.getItem(BID_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockBid[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredBids(bids: MockBid[]): void {
  localStorage.setItem(BID_STORAGE_KEY, JSON.stringify(bids));
}

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
