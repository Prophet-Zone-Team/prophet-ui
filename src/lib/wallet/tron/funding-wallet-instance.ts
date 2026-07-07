"use client";

import TronFundingWallet from "@/lib/wallet/tron/wallet";

let fundingWalletInstance: TronFundingWallet | null = null;

export function setTronFundingWalletInstance(wallet: TronFundingWallet | null) {
  fundingWalletInstance = wallet;
}

export function getTronFundingWalletInstance(): TronFundingWallet | null {
  return fundingWalletInstance;
}
