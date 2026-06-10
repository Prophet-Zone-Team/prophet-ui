"use client";

import { useCallback, useEffect, useState } from "react";

import { getConfidentialBalances } from "@/lib/confidential/client";
import type { ConfidentialBalanceView } from "@/lib/confidential/types";

export interface UseConfidentialBalanceOptions {
  enabled?: boolean;
}

export interface UseConfidentialBalanceResult {
  loading: boolean;
  usdc?: ConfidentialBalanceView;
  error?: string;
  refetch: () => Promise<void>;
}

/** Reads the Confidential account's Polygon USDC balance. */
export function useConfidentialBalance(
  options: UseConfidentialBalanceOptions = {},
): UseConfidentialBalanceResult {
  const { enabled = true } = options;
  const [loading, setLoading] = useState(false);
  const [usdc, setUsdc] = useState<ConfidentialBalanceView | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const payload = await getConfidentialBalances();
      setUsdc(payload.usdc);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load private balance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void refetch();
    }
  }, [enabled, refetch]);

  return { loading, usdc, error, refetch };
}
