import type { FundingWalletSlice } from "@/store/use-funding-wallet-store";

export function buildNearFundingSlicePatch(
  accountId: string | null,
  walletName?: string,
): Partial<FundingWalletSlice> {
  if (accountId) {
    return {
      address: accountId,
      connected: true,
      connecting: false,
      walletName,
    };
  }

  return {
    address: undefined,
    connected: false,
    connecting: false,
    walletName: undefined,
  };
}
