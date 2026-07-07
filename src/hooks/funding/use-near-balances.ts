"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import type { StableflowDepositToken } from "@/lib/funding/stableflow";
import { useNearAccountStore } from "@/lib/wallet/near/near-account-store";
import {
  buildNearBalanceKey,
  fetchNearTokenBalances,
  type NearBalancesByKey,
} from "@/lib/wallet/near/near-balance";

const EMPTY_NEAR_BALANCES: NearBalancesByKey = {};

export interface UseNearBalancesOptions {
  enabled?: boolean;
  tokens?: StableflowDepositToken[];
}

export interface UseNearBalancesResult {
  balances: NearBalancesByKey;
  loading: boolean;
  getTokenBalance: (token: Pick<StableflowDepositToken, "chainId" | "address" | "blockchain">) => string;
  refresh: () => Promise<void>;
}

function balancesAreEqual(
  left: NearBalancesByKey,
  right: NearBalancesByKey,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

export function useNearBalances(options: UseNearBalancesOptions = {}): UseNearBalancesResult {
  const { enabled = true, tokens = [] } = options;
  const [balances, setBalances] = useState<NearBalancesByKey>(EMPTY_NEAR_BALANCES);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const { accountId } = useNearAccountStore();

  const nearTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          token.blockchain === "near" &&
          token.chainId === FUNDING_NETWORKS.near.chainId,
      ),
    [tokens],
  );

  const nearTokenKey = useMemo(
    () => nearTokens.map((token) => `${token.assetId}:${token.address}`).join("|"),
    [nearTokens],
  );

  const clearBalances = useCallback(() => {
    setBalances((current) =>
      Object.keys(current).length === 0 ? current : EMPTY_NEAR_BALANCES,
    );
  }, []);

  const refresh = async () => {
    if (!enabled || nearTokens.length === 0) {
      clearBalances();
      setLoading(false);
      return;
    }

    if (!accountId) {
      clearBalances();
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const nextBalances = await fetchNearTokenBalances({
        accountId,
        tokens: nearTokens.map((token) => ({
          chainId: token.chainId,
          address: token.address,
          contractId: token.address,
          decimals: token.decimals,
        })),
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setBalances((current) =>
        balancesAreEqual(current, nextBalances) ? current : nextBalances,
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void refresh();
  }, [accountId, nearTokens, enabled]);

  const getTokenBalance = useCallback(
    (token: Pick<StableflowDepositToken, "chainId" | "address" | "blockchain">) => {
      if (token.blockchain !== "near") {
        return "0";
      }

      return balances[buildNearBalanceKey(token)] || "0";
    },
    [balances],
  );

  return {
    balances,
    loading,
    getTokenBalance,
    refresh,
  };
}
