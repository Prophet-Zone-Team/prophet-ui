"use client";

import {
  TP_BLOCKCHAIN_POLYGON,
  TP_BLOCKCHAIN_SOLANA,
  TP_BLOCKCHAIN_TRON,
} from "@/lib/wallet/tokenpocket/constants";
import {
  clearTokenPocketRedirectPath,
  ensureTpWallet,
  type EnsureTpWalletResult,
} from "@/lib/wallet/tokenpocket/ensure-tp-wallet";

export type EnsureMaticWalletResult = EnsureTpWalletResult;

export async function ensureMaticWallet(): Promise<EnsureMaticWalletResult> {
  return ensureTpWallet(TP_BLOCKCHAIN_POLYGON);
}

export async function ensureTronWallet(): Promise<EnsureTpWalletResult> {
  return ensureTpWallet(TP_BLOCKCHAIN_TRON);
}

export async function ensureSolanaWallet(): Promise<EnsureTpWalletResult> {
  return ensureTpWallet(TP_BLOCKCHAIN_SOLANA);
}

export { clearTokenPocketRedirectPath };
