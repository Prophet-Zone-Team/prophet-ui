"use client";

import { useCallback } from "react";

import { FundingNetworkType } from "@/config/funding/networks";
import type { FundingToken } from "@/config/funding/tokens";
import {
  getFundingWalletChainType,
  requiresFundingWalletConnection,
} from "@/lib/funding/stableflow";
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

  return {
    connectForToken,
    disconnectForToken,
    isConnectedForToken,
    getConnectLabelKey,
  };
}
