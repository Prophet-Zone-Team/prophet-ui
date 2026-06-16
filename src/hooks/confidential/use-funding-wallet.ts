"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { disconnectWagmiWallet } from "@/components/trading/wallet-provider";
import { useConnectGate } from "@/context/rainbowkit/connect-gate";
import { useUnifiedAccount } from "@/hooks/wallet/use-unified-account";
import type { FundingWalletChainType } from "@/store/use-funding-wallet-store";
import {
  getFundingWalletConnectHandler,
  getFundingWalletDisconnectHandler,
  useFundingWalletStore,
} from "@/store/use-funding-wallet-store";

export interface UseFundingWalletResult {
  chainType?: FundingWalletChainType;
  address?: string;
  connected: boolean;
  connecting: boolean;
  error?: string;
  connect: (chainType?: FundingWalletChainType) => Promise<string | undefined>;
  disconnect: () => Promise<void>;
}

/**
 * Funding Wallet connection for the private domain. Independent from trading auth.
 */
export function useFundingWallet(
  preferredChainType: FundingWalletChainType = "evm",
): UseFundingWalletResult {
  const { openConnectAndWait } = useConnectGate();
  const { address: evmAddress, connected: evmConnected } = useUnifiedAccount();
  const [activeChainType, setActiveChainType] = useState<FundingWalletChainType>(preferredChainType);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const fundingSlices = useFundingWalletStore(
    useShallow((state) => ({
      solana: state.solana,
      tron: state.tron,
      near: state.near,
    })),
  );
  const setSlice = useFundingWalletStore((state) => state.setSlice);
  const registerConnectHandler = useFundingWalletStore((state) => state.registerConnectHandler);
  const registerDisconnectHandler = useFundingWalletStore((state) => state.registerDisconnectHandler);

  useEffect(() => {
    setSlice("evm", {
      address: evmConnected ? evmAddress : undefined,
      connected: evmConnected && Boolean(evmAddress),
      connecting: false,
    });
  }, [evmAddress, evmConnected, setSlice]);

  const handleEvmConnect = useCallback(async () => {
    return openConnectAndWait();
  }, [openConnectAndWait]);

  const handleEvmDisconnect = useCallback(async () => {
    await disconnectWagmiWallet();
    setSlice("evm", {
      address: undefined,
      connected: false,
      connecting: false,
      walletName: undefined,
    });
  }, [setSlice]);

  const handleEvmConnectRef = useRef(handleEvmConnect);
  const handleEvmDisconnectRef = useRef(handleEvmDisconnect);

  useEffect(() => {
    handleEvmConnectRef.current = handleEvmConnect;
    handleEvmDisconnectRef.current = handleEvmDisconnect;
  });

  useEffect(() => {
    registerConnectHandler("evm", () => handleEvmConnectRef.current());
    registerDisconnectHandler("evm", () => handleEvmDisconnectRef.current());
  }, [registerConnectHandler, registerDisconnectHandler]);

  const activeSlice = useMemo(() => {
    if (activeChainType === "evm") {
      return {
        address: evmConnected ? evmAddress : undefined,
        connected: evmConnected && Boolean(evmAddress),
        connecting,
      };
    }

    return fundingSlices[activeChainType];
  }, [activeChainType, connecting, evmAddress, evmConnected, fundingSlices]);

  const connect = useCallback(
    async (chainType: FundingWalletChainType = activeChainType) => {
      setActiveChainType(chainType);
      setConnecting(true);
      setError(undefined);

      try {
        const handler = getFundingWalletConnectHandler(chainType);
        return handler ? await handler() : undefined;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to connect wallet.");
        return undefined;
      } finally {
        setConnecting(false);
      }
    },
    [activeChainType],
  );

  const disconnect = useCallback(async () => {
    const handler = getFundingWalletDisconnectHandler(activeChainType);

    if (handler) {
      await handler();
    }
  }, [activeChainType]);

  return {
    chainType: activeChainType,
    address: activeSlice.address,
    connected: Boolean(activeSlice.connected && activeSlice.address),
    connecting: connecting || activeSlice.connecting,
    error,
    connect,
    disconnect,
  };
}
