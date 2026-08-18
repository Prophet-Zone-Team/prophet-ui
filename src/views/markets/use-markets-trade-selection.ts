"use client";

import { useCallback, useState } from "react";

import {
  useSelectFixtureOutcome,
  useSetTradeMatchOutcomeSide,
  useSetTradeOrderMode,
  useSetTradeTab
} from "@/store/trade-ticket-store";
import type { WorldCupMatch } from "@/types/market";
import { mapMatchToMarketItemProps } from "@/views/markets/content/map-match-to-market-item";
import type { MarketOddsOption } from "@/views/markets/content/market-item/types";
import { resolveMarketOddsSelection } from "@/views/markets/content/resolve-market-odds-selection";

export function useMarketsTradeSelection() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedOddsId, setSelectedOddsId] = useState<string | null>(null);

  const selectFixtureOutcome = useSelectFixtureOutcome();
  const setMatchOutcomeSide = useSetTradeMatchOutcomeSide();
  const setTab = useSetTradeTab();
  const setOrderMode = useSetTradeOrderMode();

  const applyOddsSelection = useCallback(
    (match: WorldCupMatch, option: MarketOddsOption) => {
      const selection = resolveMarketOddsSelection(match, option);

      if (selection.fixtureOutcome) {
        selectFixtureOutcome(selection.fixtureOutcome, "yes");
        return;
      }

      if (selection.matchOutcomeSide) {
        setMatchOutcomeSide(selection.matchOutcomeSide);
      }
    },
    [selectFixtureOutcome, setMatchOutcomeSide]
  );

  const selectMatchOdds = useCallback(
    (match: WorldCupMatch, option: MarketOddsOption) => {
      setSelectedMatchId(match.id);
      setSelectedOddsId(option.id);
      setTab("buy");
      setOrderMode("market");
      applyOddsSelection(match, option);
    },
    [applyOddsSelection, setOrderMode, setTab]
  );

  const selectMatch = useCallback(
    (match: WorldCupMatch) => {
      const props = mapMatchToMarketItemProps(match);
      const defaultOption = props.moneylineOdds[0];

      if (defaultOption) {
        selectMatchOdds(match, defaultOption);
        return;
      }

      setSelectedMatchId(match.id);
      setSelectedOddsId(null);
      setTab("buy");
      setOrderMode("market");
    },
    [selectMatchOdds, setOrderMode, setTab]
  );

  const clearSelection = useCallback(() => {
    setSelectedMatchId(null);
    setSelectedOddsId(null);
  }, []);

  const syncVisibleMatches = useCallback(
    (matches: WorldCupMatch[]) => {
      if (matches.length === 0) {
        clearSelection();
        return;
      }

      const currentStillVisible =
        selectedMatchId !== null &&
        matches.some((match) => match.id === selectedMatchId);

      if (!currentStillVisible) {
        selectMatch(matches[0]!);
      }
    },
    [clearSelection, selectMatch, selectedMatchId]
  );

  return {
    selectedMatchId,
    selectedOddsId,
    selectMatchOdds,
    syncVisibleMatches,
    clearSelection
  };
}
