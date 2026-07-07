import type { FundingToken } from "@/config/funding/tokens";
import { FundingNetworkType } from "@/config/funding/networks";
import type { AuthLoginMethod } from "@/store/auth-store";
import { getNearAccountSnapshot } from "@/lib/wallet/near/near-account-store";
import {
  isNearOriginStableflowToken,
  requiresDepositFundingWalletConnection,
  resolveFundingWalletAddress,
} from "@/lib/funding/stableflow";

export type DepositConnectLabelKey =
  | "connectChainWallet"
  | "connectSolanaWallet"
  | "connectTronWallet"
  | "connectNearWallet"
  | "connectWallet";

/**
 * Resolves the wallet address used for deposit transfers only (not auth/session).
 */
export function resolveDepositTransferWalletAddress(
  token: Pick<FundingToken, "chainType" | "chainName"> & { blockchain?: string },
  loginMethod: AuthLoginMethod | null | undefined,
  sessionWalletAddress?: string,
): string | undefined {
  if (
    loginMethod === "near" &&
    token.blockchain &&
    isNearOriginStableflowToken({ blockchain: token.blockchain })
  ) {
    return (
      resolveFundingWalletAddress(token) ??
      getNearAccountSnapshot().accountId ??
      undefined
    );
  }

  if (requiresDepositFundingWalletConnection(token, loginMethod)) {
    return resolveFundingWalletAddress(token);
  }

  return sessionWalletAddress;
}

export function isDepositTransferWalletConnected(
  token: Pick<FundingToken, "chainType" | "chainName"> & { blockchain?: string },
  loginMethod: AuthLoginMethod | null | undefined,
  sessionWalletAddress?: string,
): boolean {
  return Boolean(
    resolveDepositTransferWalletAddress(token, loginMethod, sessionWalletAddress),
  );
}

export function getDepositConnectLabelKey(
  token: Pick<FundingToken, "chainType" | "chainName">,
): DepositConnectLabelKey {
  switch (token.chainType) {
    case FundingNetworkType.SVM:
      return "connectSolanaWallet";
    case FundingNetworkType.TVM:
      return "connectTronWallet";
    case FundingNetworkType.NEAR:
      return "connectNearWallet";
    case FundingNetworkType.EVM:
      return "connectChainWallet";
    default:
      return "connectWallet";
  }
}
