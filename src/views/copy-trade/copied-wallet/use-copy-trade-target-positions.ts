"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  collectUniqueConditionIdsFromClosedPositions,
  mapActiveTargetPositionsToDisplay,
  mapEndedTargetPositionsToDisplay
} from "@/lib/copy-trade/map-target-positions";
import { collectUniqueConditionIdsFromPositions } from "@/lib/portfolio/teams-condition";
import { fetchJson } from "@/lib/team/client-fetch";
import { useTeamsConditionStore } from "@/store/teams-condition-store";
import type { UserClosedPositionRecord, UserPositionRecord } from "@/types/market";
import { COPY_WALLET_POSITIONS_PAGE_SIZE } from "@/views/copy-trade/copied-wallet/positions-panel/constants";
import type { CopyWalletPositionDisplay } from "@/views/copy-trade/copied-wallet/positions-panel/types";

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
    if (!enabled || !wallet) {
      return;
    }

    let cancelled = false;

    async function loadActivePositions() {
      setLoadingActive(true);
      setErrorActive(undefined);

      try {
        const offset = (activePage - 1) * COPY_WALLET_POSITIONS_PAGE_SIZE;
        const payload = await fetchJson<{ positions?: UserPositionRecord[] }>(
          `/api/market/user-positions?user=${encodeURIComponent(wallet)}&limit=${COPY_WALLET_POSITIONS_PAGE_SIZE}&offset=${offset}&sizeThreshold=0`
        );
        const rawPositions = payload.positions ?? [];
        const conditionIds =
          collectUniqueConditionIdsFromPositions(rawPositions);
        const marketContextMap = await ensureTeamsCondition(conditionIds);
        const nextPositions = mapActiveTargetPositionsToDisplay(
          rawPositions,
          marketContextMap
        );

        if (!cancelled) {
          setActivePositions(nextPositions);
          setActiveHasMore(
            rawPositions.length === COPY_WALLET_POSITIONS_PAGE_SIZE
          );
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
  }, [activePage, enabled, ensureTeamsCondition, wallet]);

  useEffect(() => {
    if (!enabled || !wallet || !endedEnabled) {
      return;
    }

    let cancelled = false;

    async function loadEndedPositions() {
      setLoadingEnded(true);
      setErrorEnded(undefined);

      try {
        const offset = (endedPage - 1) * COPY_WALLET_POSITIONS_PAGE_SIZE;
        const payload = await fetchJson<{
          positions?: UserClosedPositionRecord[];
        }>(
          `/api/market/user-closed-positions?user=${encodeURIComponent(wallet)}&limit=${COPY_WALLET_POSITIONS_PAGE_SIZE}&offset=${offset}&sortBy=TIMESTAMP&sortDirection=DESC`
        );
        const rawPositions = payload.positions ?? [];
        const conditionIds =
          collectUniqueConditionIdsFromClosedPositions(rawPositions);
        const marketContextMap = await ensureTeamsCondition(conditionIds);
        const nextPositions = mapEndedTargetPositionsToDisplay(
          rawPositions,
          marketContextMap
        );

        if (!cancelled) {
          setEndedPositions(nextPositions);
          setEndedHasMore(
            rawPositions.length === COPY_WALLET_POSITIONS_PAGE_SIZE
          );
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
  }, [enabled, endedEnabled, endedPage, ensureTeamsCondition, wallet]);

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
