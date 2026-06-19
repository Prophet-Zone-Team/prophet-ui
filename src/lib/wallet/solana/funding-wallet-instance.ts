"use client";

import SolanaFundingWallet from "@/lib/wallet/solana/wallet";

let fundingWalletInstance: SolanaFundingWallet | null = null;

export function setFundingWalletInstance(wallet: SolanaFundingWallet | null) {
  fundingWalletInstance = wallet;
}

export function getFundingWalletInstance(): SolanaFundingWallet | null {
  return fundingWalletInstance;
}
