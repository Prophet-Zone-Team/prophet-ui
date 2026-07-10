"use client";

import Big from "big.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FundingAsset } from "@/config/funding";
import { FundingNetworkType } from "@/config/funding";
import { useEvmBalances } from "@/hooks/funding/use-evm-balances";
import { useSolBalances } from "@/hooks/funding/use-sol-balances";
import { useTronBalances } from "@/hooks/funding/use-tron-balances";
import {
  copyAssetsToFundingAssets,
  fundingNetworkTypeToWalletChainType,
  getConnectedDepositAssets,
  getCopyDepositChainOptions,
  getCopyDepositTokensForChain,
  resolveCopyDepositAddress,
  type CopyDepositChainOption,
} from "@/lib/copy-trade/deposit-assets";
import { selectFundingTokenBalanceString } from "@/lib/funding/balance-selectors";
import { resolveDepositTransferWalletAddress } from "@/lib/funding/deposit-transfer-wallet";
import { ensureWalletChain, transferDepositFunds } from "@/lib/wallet";
import {
  createCopyTradeDepositAddress,
  getCopyTradeDepositStatus,
} from "@/service/copy-trade/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { useBalancesStore } from "@/store/use-balances";
import { useCopyTradeFundingStore } from "@/store/copy-trade-funding-store";
import { useCopyTradeStoredSession } from "@/store/copy-trade-store";
import { useFundingWalletStore } from "@/store/use-funding-wallet-store";
import type {
  CopyDepositAddress,
  CopyDepositStatusResult,
} from "@/types/copy-trade-funding";

const STATUS_POLL_INTERVAL_MS = 18_000;
const AGGRESSIVE_STATUS_POLL_INTERVAL_MS = 5_000;

export interface UseCopyTradeDepositOptions {
  open: boolean;
  onCredited?: (creditedPusd: number) => void;
  aggressiveStatusPolling?: boolean;
}

export interface UseCopyTradeDepositResult {
  isSocialLogin: boolean;
  userId: number | undefined;
  walletReady: boolean;
  depositAddress: CopyDepositAddress | null;
  evmDepositAddress: string;
  copyDepositWalletAddress: string;
  addressLoading: boolean;
  addressError: string | undefined;
  status: CopyDepositStatusResult | null;
  assetsLoading: boolean;
  chainOptions: CopyDepositChainOption[];
  getTokensForChain: (chainId: number) => FundingAsset[];
  resolveTokenBalance: (token: FundingAsset) => string;
  resolveDepositAddressForToken: (token: FundingAsset) => string;
  totalBalanceUsd: number;
  balancesLoading: boolean;
  refreshAddress: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  transferDeposit: (amount: string, token: FundingAsset) => Promise<string>;
}

export function useCopyTradeDeposit(
  options: UseCopyTradeDepositOptions,
): UseCopyTradeDepositResult {
  const { open, onCredited, aggressiveStatusPolling = false } = options;

  const loginMethod = useAuthStore((state) => state.loginMethod);
  const isSocialLogin = loginMethod === "email" || loginMethod === "google";
  const connectedWalletAddress = useAuthStore(
    (state) => state.session?.walletAddress,
  );

  const copyTradeSession = useCopyTradeStoredSession();
  const userId = copyTradeSession?.user?.ID;
  const copyWallet = copyTradeSession?.copyWallet ?? null;
  const walletReady = Boolean(
    copyWallet?.CopyDepositWalletAddress &&
      copyWallet.WalletStatus?.toLowerCase() === "deployed",
  );

  const depositAssetsRaw = useCopyTradeFundingStore(
    (state) => state.depositAssets,
  );
  const assetsLoading = useCopyTradeFundingStore(
    (state) => state.depositAssetsLoading,
  );
  const loadDepositAssets = useCopyTradeFundingStore(
    (state) => state.loadDepositAssets,
  );

  const solanaConnected = useFundingWalletStore((state) => state.solana.connected);
  const tronConnected = useFundingWalletStore((state) => state.tron.connected);

  const [depositAddress, setDepositAddress] =
    useState<CopyDepositAddress | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | undefined>();
  const [status, setStatus] = useState<CopyDepositStatusResult | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCreditedAtRef = useRef(0);
  const onCreditedRef = useRef(onCredited);
  const statusPollInFlightRef = useRef(false);

  onCreditedRef.current = onCredited;

  const fundingAssets = useMemo(
    () => copyAssetsToFundingAssets(depositAssetsRaw),
    [depositAssetsRaw],
  );

  const connectedAssets = useMemo(
    () => getConnectedDepositAssets(fundingAssets),
    [fundingAssets],
  );

  const solAssets = useMemo(
    () =>
      fundingAssets.filter(
        (asset) => asset.chainType === FundingNetworkType.SVM,
      ),
    [fundingAssets],
  );

  const tronAssets = useMemo(
    () =>
      fundingAssets.filter(
        (asset) => asset.chainType === FundingNetworkType.TVM,
      ),
    [fundingAssets],
  );

  const chainOptions = useMemo(
    () => getCopyDepositChainOptions(fundingAssets),
    [fundingAssets],
  );

  const walletFlowEnabled = open && !isSocialLogin;

  const { loading: evmBalancesLoading } = useEvmBalances({
    auto: walletFlowEnabled,
    enabled: walletFlowEnabled && connectedAssets.length > 0,
    tokens: connectedAssets,
  });

  const { loading: solBalancesLoading, getTokenBalance: getSolTokenBalance } =
    useSolBalances({
      enabled: walletFlowEnabled && solAssets.length > 0,
      tokens: solAssets,
    });

  const { loading: tronBalancesLoading, getTokenBalance: getTronTokenBalance } =
    useTronBalances({
      enabled: walletFlowEnabled && tronAssets.length > 0,
      tokens: tronAssets,
    });

  const evmBalances = useBalancesStore((state) => state.evmBalances);

  const resolveTokenBalance = useCallback(
    (token: FundingAsset) => {
      switch (token.chainType) {
        case FundingNetworkType.SVM:
          return solanaConnected ? getSolTokenBalance(token) : "0";
        case FundingNetworkType.TVM:
          return tronConnected ? getTronTokenBalance(token) : "0";
        default:
          return selectFundingTokenBalanceString(evmBalances, token);
      }
    },
    [
      evmBalances,
      getSolTokenBalance,
      getTronTokenBalance,
      solanaConnected,
      tronConnected,
    ],
  );

  const balancesLoading =
    evmBalancesLoading ||
    (solanaConnected && solBalancesLoading) ||
    (tronConnected && tronBalancesLoading);

  const totalBalanceUsd = useMemo(() => {
    let total = Big(0);

    for (const asset of connectedAssets) {
      const balance = selectFundingTokenBalanceString(evmBalances, asset);
      try {
        total = total.plus(Big(balance || 0));
      } catch {
        continue;
      }
    }

    if (solanaConnected) {
      for (const asset of solAssets) {
        try {
          total = total.plus(Big(getSolTokenBalance(asset) || 0));
        } catch {
          continue;
        }
      }
    }

    if (tronConnected) {
      for (const asset of tronAssets) {
        try {
          total = total.plus(Big(getTronTokenBalance(asset) || 0));
        } catch {
          continue;
        }
      }
    }

    return total.toNumber();
  }, [
    connectedAssets,
    evmBalances,
    getSolTokenBalance,
    getTronTokenBalance,
    solAssets,
    solanaConnected,
    tronAssets,
    tronConnected,
  ]);

  const getTokensForChain = useCallback(
    (chainId: number) => getCopyDepositTokensForChain(fundingAssets, chainId),
    [fundingAssets],
  );

  const resolveDepositAddressForToken = useCallback(
    (token: FundingAsset) =>
      resolveCopyDepositAddress(depositAddress, token.chainType),
    [depositAddress],
  );

  const refreshAddress = useCallback(async () => {
    if (!userId) {
      return;
    }

    setAddressLoading(true);
    setAddressError(undefined);
    try {
      const address = await createCopyTradeDepositAddress(userId);
      setDepositAddress(address);
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setAddressLoading(false);
    }
  }, [userId]);

  const refreshStatus = useCallback(async () => {
    if (!userId || statusPollInFlightRef.current) {
      return;
    }

    statusPollInFlightRef.current = true;
    try {
      const result = await getCopyTradeDepositStatus(userId);
      setStatus(result);
      if (result.credited_pusd > 0) {
        const now = Date.now();
        if (now - lastCreditedAtRef.current > 1_000) {
          lastCreditedAtRef.current = now;
          onCreditedRef.current?.(result.credited_pusd);
        }
      }
    } catch {
      // Silent during background polling; surfaced via address/status UI.
    } finally {
      statusPollInFlightRef.current = false;
    }
  }, [userId]);

  const transferDeposit = useCallback(
    async (amount: string, token: FundingAsset): Promise<string> => {
      const transferWalletAddress = resolveDepositTransferWalletAddress(
        token,
        loginMethod,
        connectedWalletAddress,
      );

      if (!transferWalletAddress) {
        throw new Error("Connect a wallet before depositing funds.");
      }

      const chainType = fundingNetworkTypeToWalletChainType(token.chainType);
      if (!chainType) {
        throw new Error("This chain is not supported for wallet deposits.");
      }

      const toAddress = resolveCopyDepositAddress(
        depositAddress,
        token.chainType,
      );
      if (!toAddress) {
        throw new Error("Deposit address is unavailable for this chain.");
      }

      await ensureWalletChain({
        chainType,
        walletAddress: transferWalletAddress,
        chainId: token.chainId,
      });

      const { txHash } = await transferDepositFunds({
        chainType,
        walletAddress: transferWalletAddress,
        tokenAddress: token.address,
        toAddress,
        amount,
        tokenDecimals: token.decimals,
        chainId: token.chainId,
        symbol: token.symbol,
      });

      window.setTimeout(() => void refreshStatus(), 15_000);

      return txHash;
    },
    [connectedWalletAddress, depositAddress, loginMethod, refreshStatus],
  );

  useEffect(() => {
    if (!open || !userId || !walletReady) {
      return;
    }

    void loadDepositAssets();
    void refreshAddress();
  }, [loadDepositAssets, open, refreshAddress, userId, walletReady]);

  const pollIntervalMs = aggressiveStatusPolling
    ? AGGRESSIVE_STATUS_POLL_INTERVAL_MS
    : STATUS_POLL_INTERVAL_MS;

  useEffect(() => {
    if (!open || !userId || !walletReady) {
      return undefined;
    }

    void refreshStatus();
    pollTimerRef.current = setInterval(() => {
      void refreshStatus();
    }, pollIntervalMs);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open, pollIntervalMs, refreshStatus, userId, walletReady]);

  useEffect(() => {
    if (open) {
      return;
    }

    setStatus(null);
    setAddressError(undefined);
    lastCreditedAtRef.current = 0;
  }, [open]);

  const evmDepositAddress = depositAddress?.evm_deposit_address ?? "";
  const copyDepositWalletAddress = copyWallet?.CopyDepositWalletAddress ?? "";

  return {
    isSocialLogin,
    userId,
    walletReady,
    depositAddress,
    evmDepositAddress,
    copyDepositWalletAddress,
    addressLoading,
    addressError,
    status,
    assetsLoading,
    chainOptions,
    getTokensForChain,
    resolveTokenBalance,
    resolveDepositAddressForToken,
    totalBalanceUsd,
    balancesLoading,
    refreshAddress,
    refreshStatus,
    transferDeposit,
  };
}
