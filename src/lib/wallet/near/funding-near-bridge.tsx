"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  disconnectNearWallet,
  openNearWalletModal,
} from "@/lib/wallet/near/near-connect";
import { getNearAccountSnapshot, useNearAccountStore } from "@/lib/wallet/near/near-account-store";
import { buildNearFundingSlicePatch } from "@/lib/wallet/near/sync-near-funding-slice";
import { useFundingWalletStore } from "@/store/use-funding-wallet-store";

const CONNECT_POLL_MS = 200;
const CONNECT_TIMEOUT_MS = 120_000;

function waitForNearAccountId(): Promise<string> {
  const existing = getNearAccountSnapshot().accountId;

  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const finish = (accountId: string | null, error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      unsubscribe();
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);

      if (accountId) {
        resolve(accountId);
        return;
      }

      reject(error ?? new Error("Timed out connecting the NEAR wallet."));
    };

    const unsubscribe = useNearAccountStore.subscribe((state) => {
      if (state.accountId) {
        finish(state.accountId);
      }
    });

    const pollId = window.setInterval(() => {
      const accountId = getNearAccountSnapshot().accountId;

      if (accountId) {
        finish(accountId);
      }
    }, CONNECT_POLL_MS);

    const timeoutId = window.setTimeout(() => {
      finish(null);
    }, CONNECT_TIMEOUT_MS);
  });
}

export function FundingNearBridge() {
  const setSlice = useFundingWalletStore((state) => state.setSlice);
  const registerConnectHandler = useFundingWalletStore((state) => state.registerConnectHandler);
  const registerDisconnectHandler = useFundingWalletStore((state) => state.registerDisconnectHandler);

  const handleConnect = useCallback(async () => {
    const existingAccountId = getNearAccountSnapshot().accountId;

    if (existingAccountId) {
      const { walletName } = getNearAccountSnapshot();
      setSlice("near", buildNearFundingSlicePatch(existingAccountId, walletName));
      return existingAccountId;
    }

    setSlice("near", { connecting: true });

    try {
      openNearWalletModal();
      const accountId = await waitForNearAccountId();
      const { walletName } = getNearAccountSnapshot();
      setSlice("near", buildNearFundingSlicePatch(accountId, walletName));
      return accountId;
    } finally {
      setSlice("near", { connecting: false });
    }
  }, [setSlice]);

  const handleDisconnect = useCallback(async () => {
    await disconnectNearWallet();
    setSlice("near", buildNearFundingSlicePatch(null));
  }, [setSlice]);

  const handleConnectRef = useRef(handleConnect);
  const handleDisconnectRef = useRef(handleDisconnect);

  useEffect(() => {
    handleConnectRef.current = handleConnect;
    handleDisconnectRef.current = handleDisconnect;
  });

  useEffect(() => {
    registerConnectHandler("near", () => handleConnectRef.current());
    registerDisconnectHandler("near", () => handleDisconnectRef.current());
  }, [registerConnectHandler, registerDisconnectHandler]);

  useEffect(() => {
    const syncNearFundingSlice = () => {
      const { accountId, walletName } = getNearAccountSnapshot();
      setSlice("near", buildNearFundingSlicePatch(accountId, walletName));
    };

    syncNearFundingSlice();

    return useNearAccountStore.subscribe((state, previousState) => {
      if (
        state.accountId === previousState.accountId &&
        state.walletName === previousState.walletName
      ) {
        return;
      }

      syncNearFundingSlice();
    });
  }, [setSlice]);

  return null;
}
