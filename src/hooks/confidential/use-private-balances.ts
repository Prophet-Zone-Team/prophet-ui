"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth";
import { fetchConfidentialAccount, fetchConfidentialBalances } from "@/lib/confidential/client";
import type { ConfidentialAccountResponse, ConfidentialBalancesResponse } from "@/types/confidential";

export function usePrivateBalances(options?: { enabled?: boolean; auto?: boolean }) {
  const { session, isAuthenticated } = useAuth();
  const enabled = (options?.enabled ?? true) && isAuthenticated;
  const [account, setAccount] = useState<ConfidentialAccountResponse | undefined>();
  const [balances, setBalances] = useState<ConfidentialBalancesResponse | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    if (!enabled || !session?.walletAddress) {
      setAccount(undefined);
      setBalances(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const accountPayload = await fetchConfidentialAccount();
      setAccount(accountPayload);

      if (accountPayload.authStatus === "authenticated") {
        const balancePayload = await fetchConfidentialBalances();
        setBalances(balancePayload);
      } else {
        setBalances(undefined);
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
    } finally {
      setLoading(false);
    }
  }, [enabled, session?.walletAddress]);

  useEffect(() => {
    if (options?.auto !== false && enabled) {
      void refresh();
    }
  }, [enabled, options?.auto, refresh]);

  return {
    account,
    balances,
    loading,
    error,
    refresh,
    privateAccountAddress: account?.privateAccountAddress ?? session?.privateAccountAddress,
    privateBalanceUsd: balances?.privateBalanceUsd ?? 0,
    ownerWalletAddress: session?.walletAddress,
  };
}
