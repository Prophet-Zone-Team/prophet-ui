import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import type { LiveOutcomePrices } from "@/lib/market/fixture-live-prices";
import type { FixtureMarketOutcome, WorldCupMatch } from "@/types/market";

/** Set NEXT_PUBLIC_USE_MOCK_LIVE_FIXTURE=true in .env.local for local live UI testing. */
export const USE_MOCK_LIVE_FIXTURE =
  process.env.NEXT_PUBLIC_USE_MOCK_LIVE_FIXTURE === "true";

export function isMockLiveFixtureEnabled(): boolean {
  return USE_MOCK_LIVE_FIXTURE;
}

export function isEffectiveLiveMatch(match: WorldCupMatch): boolean {
  return (
    isMockLiveFixtureEnabled() ||
    getScheduleRowVariant(match.status) === "ongoing"
  );
}

export function resolveMockLiveBaseElapsedSeconds(match: WorldCupMatch): number {
  return Math.max(match.liveElapsedSeconds ?? 30 * 60, 15 * 60);
}

export function resolveMockLiveDisplayScore(match: WorldCupMatch): {
  homeScore: number;
  awayScore: number;
} {
  if (
    match.homeScore !== undefined &&
    match.awayScore !== undefined &&
    getScheduleRowVariant(match.status) === "ongoing"
  ) {
    return { homeScore: match.homeScore, awayScore: match.awayScore };
  }

  return { homeScore: 1, awayScore: 1 };
}

function resolveBaseAsk(outcome: FixtureMarketOutcome): number {
  if (outcome.yesAsk !== undefined && outcome.yesAsk > 0 && outcome.yesAsk < 1) {
    return outcome.yesAsk;
  }

  if (outcome.price !== undefined && outcome.price > 0 && outcome.price < 1) {
    return outcome.price;
  }

  const probability = outcome.probability ?? 50;
  return Math.max(0.02, Math.min(0.98, probability / 100));
}

function wobbleFactor(outcomeId: string, tickIndex: number): number {
  const seed = outcomeId.length + tickIndex * 13;
  return Math.sin(seed * 0.7) * 0.025 + Math.cos(tickIndex * 0.4 + seed) * 0.015;
}

export function buildMockLivePricesForOutcomes(
  outcomes: FixtureMarketOutcome[],
  tickIndex: number,
): Record<string, LiveOutcomePrices> {
  const prices: Record<string, LiveOutcomePrices> = {};

  for (const outcome of outcomes) {
    const baseYesAsk = resolveBaseAsk(outcome);
    const wobble = wobbleFactor(outcome.id, tickIndex);
    const yesAsk = clampAsk(baseYesAsk + wobble);
    const noAsk = clampAsk(1 - yesAsk + wobble * 0.5);

    prices[outcome.id] = {
      yesAsk,
      yesBid: clampAsk(yesAsk - 0.01),
      noAsk,
      noBid: clampAsk(noAsk - 0.01),
    };
  }

  return prices;
}

export function livePricesToFixtureAsks(
  livePrices: LiveOutcomePrices | undefined,
): { yesAsk?: number; noAsk?: number } | undefined {
  if (!livePrices) {
    return undefined;
  }

  return {
    yesAsk: livePrices.yesAsk,
    noAsk: livePrices.noAsk,
  };
}

function clampAsk(value: number): number {
  return Number(Math.max(0.02, Math.min(0.98, value)).toFixed(3));
}
