"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  collectUniqueConditionIdsFromCopyPositionPnL,
  mapActiveCopyPositionPnLToDisplay,
  mapEndedCopyPositionPnLToDisplay
} from "@/lib/copy-trade/map-copy-position-pnl";
import {
  getCopyTradePnLTargetHistory,
  getCopyTradePnLTargetPositions
} from "@/service/copy-trade";
import { useTeamsConditionStore } from "@/store/teams-condition-store";
import { COPY_WALLET_POSITIONS_PAGE_SIZE } from "@/views/copy-trade/copied-wallet/positions-panel/constants";
import type { CopyWalletPositionDisplay } from "@/views/copy-trade/copied-wallet/positions-panel/types";

import { useCopyTradeSession } from "../use-copy-trade-session";

export interface UseCopyTradeTargetPositionsOptions {
  wallet: string;
  enabled: boolean;
  endedEnabled?: boolean;
}

export interface UseCopyTradeTargetPositionsResult {
  activePositions: CopyWalletPositionDisplay[];
  endedPositions: CopyWalletPositionDisplay[];
  activePage: number;
  endedPage: number;
  setActivePage: (page: number) => void;
  setEndedPage: (page: number) => void;
  activeHasMore: boolean;
  endedHasMore: boolean;
  loadingActive: boolean;
  loadingEnded: boolean;
  errorActive: string | undefined;
  errorEnded: string | undefined;
}

export function useCopyTradeTargetPositions({
  wallet,
  enabled,
  endedEnabled = false
}: UseCopyTradeTargetPositionsOptions): UseCopyTradeTargetPositionsResult {
  const { userId } = useCopyTradeSession();
  const ensureTeamsCondition = useTeamsConditionStore(
    (state) => state.ensureTeamsCondition
  );
  const [activePage, setActivePage] = useState(1);
  const [endedPage, setEndedPage] = useState(1);
  const [activePositions, setActivePositions] = useState<
    CopyWalletPositionDisplay[]
  >([]);
  const [endedPositions, setEndedPositions] = useState<
    CopyWalletPositionDisplay[]
  >([]);
  const [activeHasMore, setActiveHasMore] = useState(false);
  const [endedHasMore, setEndedHasMore] = useState(false);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingEnded, setLoadingEnded] = useState(false);
  const [errorActive, setErrorActive] = useState<string | undefined>();
  const [errorEnded, setErrorEnded] = useState<string | undefined>();
  const previousWalletRef = useRef(wallet);
  const previousEnabledRef = useRef(enabled);

  useEffect(() => {
    const walletChanged = previousWalletRef.current !== wallet;
    const collapsed = previousEnabledRef.current && !enabled;

    previousWalletRef.current = wallet;
    previousEnabledRef.current = enabled;

    if (!enabled || walletChanged || collapsed) {
      setActivePage(1);
      setEndedPage(1);
      setActivePositions([]);
      setEndedPositions([]);
      setActiveHasMore(false);
      setEndedHasMore(false);
      setErrorActive(undefined);
      setErrorEnded(undefined);
    }
  }, [enabled, wallet]);

  useEffect(() => {
    if (!enabled || !wallet || userId == null) {
      return;
    }

    const resolvedUserId = userId;
    let cancelled = false;

    async function loadActivePositions() {
      setLoadingActive(true);
      setErrorActive(undefined);

      try {
        const payload = await getCopyTradePnLTargetPositions(
          resolvedUserId,
          wallet,
          {
            params: {
              page: activePage,
              page_size: COPY_WALLET_POSITIONS_PAGE_SIZE
            }
          }
        );
        const rawPositions = payload.items ?? [];
        const conditionIds =
          collectUniqueConditionIdsFromCopyPositionPnL(rawPositions);
        const marketContextMap = await ensureTeamsCondition(conditionIds);
        const nextPositions = mapActiveCopyPositionPnLToDisplay(
          rawPositions,
          marketContextMap
        );

        if (!cancelled) {
          setActivePositions(nextPositions);
          setActiveHasMore(payload.has_more);
        }
      } catch (error) {
        if (!cancelled) {
          setActivePositions([]);
          setActiveHasMore(false);
          setErrorActive(
            error instanceof Error ? error.message : String(error)
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingActive(false);
        }
      }
    }

    void loadActivePositions();

    return () => {
      cancelled = true;
    };
  }, [activePage, enabled, ensureTeamsCondition, userId, wallet]);

  useEffect(() => {
    if (!enabled || !wallet || userId == null || !endedEnabled) {
      return;
    }

    const resolvedUserId = userId;
    let cancelled = false;

    async function loadEndedPositions() {
      setLoadingEnded(true);
      setErrorEnded(undefined);

      try {
        const payload = await getCopyTradePnLTargetHistory(
          resolvedUserId,
          wallet,
          {
            params: {
              page: endedPage,
              page_size: COPY_WALLET_POSITIONS_PAGE_SIZE
            }
          }
        );
        const rawPositions = payload.items ?? [];
        const conditionIds =
          collectUniqueConditionIdsFromCopyPositionPnL(rawPositions);
        const marketContextMap = await ensureTeamsCondition(conditionIds);
        const nextPositions = mapEndedCopyPositionPnLToDisplay(
          rawPositions,
          marketContextMap
        );

        if (!cancelled) {
          setEndedPositions(nextPositions);
          setEndedHasMore(payload.has_more);
        }
      } catch (error) {
        if (!cancelled) {
          setEndedPositions([]);
          setEndedHasMore(false);
          setErrorEnded(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingEnded(false);
        }
      }
    }

    void loadEndedPositions();

    return () => {
      cancelled = true;
    };
  }, [enabled, endedEnabled, endedPage, ensureTeamsCondition, userId, wallet]);

  const handleSetActivePage = useCallback((page: number) => {
    setActivePage(page);
  }, []);

  const handleSetEndedPage = useCallback((page: number) => {
    setEndedPage(page);
  }, []);

  return {
    activePositions,
    endedPositions,
    activePage,
    endedPage,
    setActivePage: handleSetActivePage,
    setEndedPage: handleSetEndedPage,
    activeHasMore,
    endedHasMore,
    loadingActive,
    loadingEnded,
    errorActive,
    errorEnded
  };
}
