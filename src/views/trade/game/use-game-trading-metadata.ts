"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildFixtureMarketsSnapshot } from "@/lib/market/build-fixture-markets-snapshot";
import { buildGameMarketSnapshot } from "@/lib/market/game-market-snapshot";
import {
  isGammaEventPayload,
  mergeFixtureMarketsFromGammaEvent,
  mergeMoneylineFromGammaEvent,
  resolveSiblingEventSlugForTab,
} from "@/lib/market/merge-game-trading-metadata";
import type { GammaEventRecord } from "@/lib/market/polymarket-gamma";
import { fetchPolymarket } from "@/lib/market/polymarket-api-client";
import type { ProphetGameSiblingEventSlugs } from "@/types/prophet-api";
import type {
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch,
} from "@/types/market";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";

interface UseGameTradingMetadataInput {
  initialMatch: WorldCupMatch;
  initialGameSnapshot: GameMarketSnapshot;
  initialFixtureMarkets: GameFixtureMarketsSnapshot;
  siblingEventSlugs: ProphetGameSiblingEventSlugs;
  teamSnapshots: TeamMarketSnapshot[];
}

interface UseGameTradingMetadataResult {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  loadingTab: GameMarketTabId | null;
  ensureTabTradingData: (tab: GameMarketTabId) => Promise<void>;
  isTabTradingReady: (tab: GameMarketTabId) => boolean;
}

async function fetchGammaEventBySlug(slug: string): Promise<GammaEventRecord | undefined> {
  try {
    const payload = await fetchPolymarket<unknown>(
      `/events/slug/${encodeURIComponent(slug)}`,
    );

    return isGammaEventPayload(payload) ? payload : undefined;
  } catch {
    return undefined;
  }
}

function tabTradingDataLoaded(
  tab: GameMarketTabId,
  match: WorldCupMatch,
  fixtureMarkets: GameFixtureMarketsSnapshot,
): boolean {
  if (tab === "moneyline") {
    const outcomes = match.polymarket?.moneyline.outcomes ?? [];

    return outcomes.length >= 3 && outcomes.every((outcome) => Boolean(outcome.tokenId));
  }

  if (tab === "totals") {
    return fixtureMarkets.lines.some((group) => group.type === "total");
  }

  if (tab === "spreads") {
    return fixtureMarkets.lines.some((group) => group.type === "spread");
  }

  if (tab === "halftime") {
    return fixtureMarkets.halftime.length > 0;
  }

  if (tab === "top_scores") {
    return fixtureMarkets.exactScores.length > 0;
  }

  return false;
}

export function useGameTradingMetadata({
  initialMatch,
  initialGameSnapshot,
  initialFixtureMarkets,
  siblingEventSlugs,
  teamSnapshots,
}: UseGameTradingMetadataInput): UseGameTradingMetadataResult {
  const [match, setMatch] = useState(initialMatch);
  const [gameSnapshot, setGameSnapshot] = useState(initialGameSnapshot);
  const [fixtureMarkets, setFixtureMarkets] = useState(initialFixtureMarkets);
  const moneylineReadyInitially = useMemo(
    () => tabTradingDataLoaded("moneyline", initialMatch, initialFixtureMarkets),
    [initialFixtureMarkets, initialMatch],
  );
  const [loadedTabs, setLoadedTabs] = useState<Set<GameMarketTabId>>(() =>
    moneylineReadyInitially ? new Set(["moneyline"]) : new Set(),
  );
  const [loadingTab, setLoadingTab] = useState<GameMarketTabId | null>(null);

  useEffect(() => {
    setMatch(initialMatch);
    setGameSnapshot(initialGameSnapshot);
    setFixtureMarkets(initialFixtureMarkets);

    const moneylineReady = tabTradingDataLoaded(
      "moneyline",
      initialMatch,
      initialFixtureMarkets,
    );

    setLoadedTabs(moneylineReady ? new Set(["moneyline"]) : new Set());
    setLoadingTab(null);
  }, [initialFixtureMarkets, initialGameSnapshot, initialMatch]);

  const loadTabTradingData = useCallback(
    async (tab: GameMarketTabId) => {
      const eventSlug = resolveSiblingEventSlugForTab(tab, siblingEventSlugs);

      if (!eventSlug) {
        return;
      }

      setLoadingTab(tab);

      try {
        const event = await fetchGammaEventBySlug(eventSlug);

        if (!event) {
          return;
        }

        let nextMatch: WorldCupMatch | null = null;
        let nextFixtureMarkets = fixtureMarkets;

        setMatch((currentMatch) => {
          nextMatch =
            tab === "moneyline"
              ? mergeMoneylineFromGammaEvent(currentMatch, event)
              : mergeFixtureMarketsFromGammaEvent(currentMatch, event, tab);

          return nextMatch;
        });

        if (nextMatch) {
          nextFixtureMarkets = buildFixtureMarketsSnapshot(nextMatch);
          setGameSnapshot(buildGameMarketSnapshot(nextMatch, teamSnapshots));
          setFixtureMarkets(nextFixtureMarkets);
        }

        if (nextMatch && tabTradingDataLoaded(tab, nextMatch, nextFixtureMarkets)) {
          setLoadedTabs((current) => {
            const next = new Set(current);
            next.add(tab);
            return next;
          });
        }
      } finally {
        setLoadingTab((current) => (current === tab ? null : current));
      }
    },
    [siblingEventSlugs, teamSnapshots],
  );

  useEffect(() => {
    if (moneylineReadyInitially) {
      return;
    }

    void loadTabTradingData("moneyline");
  }, [loadTabTradingData, moneylineReadyInitially]);

  const ensureTabTradingData = useCallback(
    async (tab: GameMarketTabId) => {
      if (loadedTabs.has(tab) || loadingTab === tab) {
        return;
      }

      await loadTabTradingData(tab);
    },
    [loadTabTradingData, loadedTabs, loadingTab],
  );

  const isTabTradingReady = useCallback(
    (tab: GameMarketTabId) => {
      if (!loadedTabs.has(tab)) {
        return false;
      }

      return tabTradingDataLoaded(tab, match, fixtureMarkets);
    },
    [fixtureMarkets, loadedTabs, match],
  );

  return useMemo(
    () => ({
      match,
      gameSnapshot,
      fixtureMarkets,
      loadingTab,
      ensureTabTradingData,
      isTabTradingReady,
    }),
    [
      ensureTabTradingData,
      fixtureMarkets,
      gameSnapshot,
      isTabTradingReady,
      loadingTab,
      match,
    ],
  );
}
