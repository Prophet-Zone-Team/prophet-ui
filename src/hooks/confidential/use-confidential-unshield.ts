"use client";

import { useCallback, useRef } from "react";
import { parseUnits } from "viem";

import {
  generateConfidentialIntent,
  requestConfidentialWithdrawQuote,
  submitConfidentialIntent,
} from "@/lib/confidential/client";
import { signConfidentialMessage } from "@/lib/confidential/sign-message";
import {
  executePendingDepositConvert,
  fetchFunderCollateralBalances,
  getPendingConvertAmountUsd,
  resolvePendingDepositConvertMode,
} from "@/lib/trading/deposit-wallet-convert";

/** Polygon USDC uses 6 decimals. */
const USDC_DECIMALS = 6;
const FUNDER_POLL_INTERVAL_MS = 5000;
const FUNDER_POLL_MAX_ATTEMPTS = 120;

export type UnshieldPhase =
  | "idle"
  | "quoting"
  | "signing"
  | "submitting"
  | "awaiting_funds"
  | "converting"
  | "success"
  | "error";

export interface UseConfidentialUnshieldResult {
  unshield: (params: {
    amountUsd: string;
    eoaAddress: string;
    onPhase?: (phase: UnshieldPhase) => void;
  }) => Promise<void>;
  cancel: () => void;
}

/**
 * Unshield: move Polygon USDC out of the Confidential account to the user's
 * Polymarket funder address, then convert it to pUSD using the existing
 * deposit-convert path. The EOA (already connected on the main site) signs the
 * intent with ERC191.
 */
export function useConfidentialUnshield(): UseConfidentialUnshieldResult {
  const abortRef = useRef<AbortController | undefined>(undefined);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = undefined;
  }, []);

  const unshield = useCallback(
    async ({
      amountUsd,
      eoaAddress,
      onPhase,
    }: {
      amountUsd: string;
      eoaAddress: string;
      onPhase?: (phase: UnshieldPhase) => void;
    }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const amountBaseUnits = parseUnits(amountUsd, USDC_DECIMALS).toString();

      onPhase?.("quoting");
      const { quote } = await requestConfidentialWithdrawQuote({ amountBaseUnits });
      const depositAddress = quote.quote.depositAddress;

      if (!depositAddress) {
        throw new Error("Withdraw quote did not return a deposit address.");
      }

      const { message } = await generateConfidentialIntent({ depositAddress });

      onPhase?.("signing");
      const signature = await signConfidentialMessage(eoaAddress, message);

      onPhase?.("submitting");
      await submitConfidentialIntent({ message, signature });

      onPhase?.("awaiting_funds");
      const balances = await pollFunderBalances(controller.signal);
      const mode = resolvePendingDepositConvertMode(balances);

      if (!mode) {
        throw new Error("Funds did not arrive in the deposit wallet in time.");
      }

      onPhase?.("converting");
      await executePendingDepositConvert({
        walletAddress: eoaAddress,
        mode,
        amountUsd: getPendingConvertAmountUsd(balances, mode),
      });

      onPhase?.("success");
    },
    [],
  );

  return { unshield, cancel };
}

async function pollFunderBalances(signal: AbortSignal) {
  for (let attempt = 0; attempt < FUNDER_POLL_MAX_ATTEMPTS; attempt += 1) {
    if (signal.aborted) {
      throw new DOMException("Unshield polling aborted.", "AbortError");
    }

    const balances = await fetchFunderCollateralBalances();

    if (resolvePendingDepositConvertMode(balances)) {
      return balances;
    }

    await delay(FUNDER_POLL_INTERVAL_MS, signal);
  }

  throw new Error("Timed out waiting for funds to arrive in the deposit wallet.");
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Unshield polling aborted.", "AbortError"));
      return;
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Unshield polling aborted.", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });
}
