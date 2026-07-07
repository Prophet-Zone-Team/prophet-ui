"use client";

import {
  TP_FUNDING_SWITCH_FLAG_KEY,
} from "@/lib/wallet/tokenpocket/constants";
import { getTpSdk } from "@/lib/wallet/tokenpocket/tp-sdk-client";
import {
  resolveTpHostKind,
  saveTpRedirectContext,
  setTpFundingSwitchFlag,
  TpFundingSwitchPendingError,
  clearTpRedirectContext,
} from "@/lib/wallet/tokenpocket/tp-funding-switch";

export type EnsureTpWalletResult = {
  alreadyActive: boolean;
  reloadPending: boolean;
};

function buildSwitchError(blockchain: string) {
  return `Switch to the ${blockchain} wallet in TokenPocket to continue.`;
}

export async function ensureTpWallet(blockchain: string): Promise<EnsureTpWalletResult> {
  const tp = await getTpSdk();

  try {
    const current = await tp.getCurrentWallet();

    if (current.result === true && current.data?.blockchain === blockchain) {
      return { alreadyActive: true, reloadPending: false };
    }
  } catch {
    // Fall through to wallet switch attempt.
  }

  saveTpRedirectContext();
  setTpFundingSwitchFlag(blockchain);

  try {
    const switched = await tp.getWallet({
      walletTypes: [blockchain],
      switch: true,
    });

    if (!switched.result) {
      throw new Error(buildSwitchError(blockchain));
    }

    return { alreadyActive: false, reloadPending: true };
  } catch (error) {
    clearTpRedirectContext();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(TP_FUNDING_SWITCH_FLAG_KEY);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(buildSwitchError(blockchain));
  }
}

export function throwTpFundingSwitchPending(blockchain: string): never {
  const hostKind =
    typeof window !== "undefined"
      ? resolveTpHostKind(window.location.hostname)
      : "main";

  throw new TpFundingSwitchPendingError(blockchain, hostKind);
}

export function clearTokenPocketRedirectPath() {
  clearTpRedirectContext();
}
