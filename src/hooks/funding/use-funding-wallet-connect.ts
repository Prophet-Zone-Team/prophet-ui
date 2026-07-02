"use client";

import { useCallback } from "react";

import { FundingNetworkType } from "@/config/funding/networks";
import type { FundingToken } from "@/config/funding/tokens";
import {
  getDepositConnectLabelKey,
  isDepositTransferWalletConnected,
  type DepositConnectLabelKey,
} from "@/lib/funding/deposit-transfer-wallet";
import {
  getFundingWalletChainType,
  requiresDepositFundingWalletConnection,
  requiresFundingWalletConnection,
} from "@/lib/funding/stableflow";
import type { AuthLoginMethod } from "@/store/auth-store";
import {
  getFundingWalletAddress,
  getFundingWalletConnectHandler,
  getFundingWalletDisconnectHandler,
} from "@/store/use-funding-wallet-store";

export function useFundingWalletConnect() {
  const connectForToken = useCallback(
    async (token: Pick<FundingToken, "chainType">) => {
      const chainType = getFundingWalletChainType(token.chainType);

      if (!chainType) {
        return undefined;
      }

      const handler = getFundingWalletConnectHandler(chainType);
      return handler ? handler() : undefined;
    },
    [],
  );

  const connectForDepositToken = useCallback(
    async (
      token: Pick<FundingToken, "chainType" | "chainName"> & { blockchain?: string },
      loginMethod: AuthLoginMethod | null | undefined,
    ) => {
      if (!requiresDepositFundingWalletConnection(token, loginMethod)) {
        return undefined;
      }

      return connectForToken(token);
    },
    [connectForToken],
  );

  const disconnectForToken = useCallback(
    async (token: Pick<FundingToken, "chainType">) => {
      const chainType = getFundingWalletChainType(token.chainType);

      if (!chainType) {
        return;
      }

      const handler = getFundingWalletDisconnectHandler(chainType);

      if (handler) {
        await handler();
      }
    },
    [],
  );

  const isConnectedForToken = useCallback(
    (token: Pick<FundingToken, "chainType">) => {
      if (!requiresFundingWalletConnection(token)) {
        return true;
      }

      const chainType = getFundingWalletChainType(token.chainType);
      return chainType ? Boolean(getFundingWalletAddress(chainType)) : true;
    },
    [],
  );

  const isConnectedForDepositToken = useCallback(
    (
      token: Pick<FundingToken, "chainType" | "chainName"> & { blockchain?: string },
      loginMethod: AuthLoginMethod | null | undefined,
      sessionWalletAddress?: string,
    ) => {
      return isDepositTransferWalletConnected(
        token,
        loginMethod,
        sessionWalletAddress,
      );
    },
    [],
  );

  const getConnectLabelKey = useCallback((token: Pick<FundingToken, "chainType">) => {
    switch (token.chainType) {
      case FundingNetworkType.SVM:
        return "connectSolanaWallet" as const;
      case FundingNetworkType.TVM:
        return "connectTronWallet" as const;
      case FundingNetworkType.NEAR:
        return "connectNearWallet" as const;
      default:
        return "connectWallet" as const;
    }
  }, []);

  const getDepositConnectLabelKeyForToken = useCallback(
    (
      token: Pick<FundingToken, "chainType" | "chainName">,
    ): DepositConnectLabelKey => {
      return getDepositConnectLabelKey(token);
    },
    [],
  );

  return {
    connectForToken,
    connectForDepositToken,
    disconnectForToken,
    isConnectedForToken,
    isConnectedForDepositToken,
    getConnectLabelKey,
    getDepositConnectLabelKey: getDepositConnectLabelKeyForToken,
  };
}
