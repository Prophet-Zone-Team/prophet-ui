"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject
} from "react";

import { mapProphetUserStrategies } from "@/lib/portfolio/map-prophet-user-strategy";
import type { PortfolioLoadStatus } from "@/lib/portfolio/types";
import {
  getProphetUserStrategies,
  isProphetAuthenticated
} from "@/service/prophet";

import type { PortfolioStrategyRecord } from "./types";

export type PortfolioStrategiesLoadOptions = {
  force?: boolean;
  silent?: boolean;
};

export interface UsePortfolioStrategiesResult {
  strategies: PortfolioStrategyRecord[];
  status: PortfolioLoadStatus;
  loadStrategies: (options?: PortfolioStrategiesLoadOptions) => Promise<void>;
  /** Stable ref; true after a successful fetch. */
  hasLoadedRef: MutableRefObject<boolean>;
}

export function usePortfolioStrategies(
  sessionConnected: boolean
): UsePortfolioStrategiesResult {
  const [strategies, setStrategies] = useState<PortfolioStrategyRecord[]>([]);
  const [status, setStatus] = useState<PortfolioLoadStatus>("idle");
  const loadedRef = useRef(false);
  const requestIdRef = useRef(0);

  const clearStrategies = useCallback(() => {
    requestIdRef.current += 1;
    setStrategies([]);
    loadedRef.current = false;
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (!sessionConnected) {
      clearStrategies();
    }
  }, [clearStrategies, sessionConnected]);

  const loadStrategies = useCallback(
    async (options?: PortfolioStrategiesLoadOptions) => {
      if (!sessionConnected) {
        clearStrategies();
        return;
      }

      if (loadedRef.current && !options?.force) {
        return;
      }

      if (!isProphetAuthenticated()) {
        setStrategies([]);
        loadedRef.current = true;
        setStatus("ready");
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!loadedRef.current || !options?.silent) {
        setStatus("loading");
      }

      try {
        const payload = await getProphetUserStrategies();

        if (requestIdRef.current !== requestId) {
          return;
        }

        setStrategies(mapProphetUserStrategies(payload.list));
        loadedRef.current = true;
        setStatus("ready");
      } catch {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setStrategies([]);
        loadedRef.current = true;
        setStatus("error");
      }
    },
    [clearStrategies, sessionConnected]
  );

  return {
    strategies,
    status,
    loadStrategies,
    hasLoadedRef: loadedRef
  };
}
