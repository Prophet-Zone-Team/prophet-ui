"use client";

import Big from "big.js";

import {
  createUnshieldQuote,
  fetchUnshieldStatus,
  generateUnshieldIntent,
  pollConfidentialStatus,
  prepareConfidentialSignedData,
  signConfidentialIntentPayload,
  submitUnshieldIntent,
} from "@/lib/confidential/client";
import {
  executePendingDepositConvert,
  fetchFunderCollateralBalances,
  getPendingConvertAmountUsd,
  resolvePendingDepositConvertMode,
} from "@/lib/trading/deposit-wallet-convert";

const USDC_DECIMALS = 6;
const FUNDER_POLL_INTERVAL_MS = 2_000;
const FUNDER_POLL_MAX_ATTEMPTS = 90;

export type PrivateBalanceTransferPhase =
  | "unshielding"
  | "waiting_funder"
  | "converting"
  | "success"
  | "error";

export interface ExecutePrivateBalanceTransferInput {
  amountUsd: string;
  ownerWalletAddress: string;
  tradingWalletAddress: string;
  onPhaseChange?: (phase: PrivateBalanceTransferPhase, label?: string) => void;
}

async function pollFunderUntilReady() {
  for (let attempt = 0; attempt < FUNDER_POLL_MAX_ATTEMPTS; attempt += 1) {
    const balances = await fetchFunderCollateralBalances();
    const mode = resolvePendingDepositConvertMode(balances);

    if (mode) {
      return { balances, mode };
    }

    await new Promise((resolve) => {
      setTimeout(resolve, FUNDER_POLL_INTERVAL_MS);
    });
  }

  throw new Error("Timed out waiting for Polymarket deposit wallet funding.");
}

export async function executePrivateBalanceTransfer({
  amountUsd,
  ownerWalletAddress,
  tradingWalletAddress,
  onPhaseChange,
}: ExecutePrivateBalanceTransferInput) {
  const amountBaseUnits = Big(amountUsd || 0)
    .times(10 ** USDC_DECIMALS)
    .toFixed(0, 0);

  if (!Big(amountBaseUnits).gt(0)) {
    throw new Error("Enter a transfer amount greater than zero.");
  }

  onPhaseChange?.("unshielding", "Unshielding private USDC");

  const quote = await createUnshieldQuote(amountBaseUnits);
  const intentPayload = await generateUnshieldIntent(quote.depositAddress);
  const signature = await signConfidentialIntentPayload(
    ownerWalletAddress,
    intentPayload.intent as { standard: string; payload: string | unknown },
  );
  const signedData = prepareConfidentialSignedData(signature, ownerWalletAddress);

  await submitUnshieldIntent(quote.depositAddress, signedData);

  await pollConfidentialStatus(
    fetchUnshieldStatus,
    quote.depositAddress,
    quote.depositMemo,
  );

  onPhaseChange?.("waiting_funder", "Waiting for deposit wallet funding");

  const { balances, mode } = await pollFunderUntilReady();

  onPhaseChange?.("converting", "Converting USDC to pUSD");

  await executePendingDepositConvert({
    walletAddress: tradingWalletAddress,
    mode,
    amountUsd: getPendingConvertAmountUsd(balances, mode),
    onStatus: (label) => onPhaseChange?.("converting", label),
  });

  onPhaseChange?.("success", "Transfer complete");
}
