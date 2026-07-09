"use client";

import Big from "big.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FundingAsset } from "@/config/funding";
import { useEvmBalances } from "@/hooks/funding/use-evm-balances";
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
import { ensureWalletChain, transferDepositFunds } from "@/lib/wallet";
import {
  createCopyTradeDepositAddress,
  getCopyTradeDepositStatus,
} from "@/service/copy-trade/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { useBalancesStore } from "@/store/use-balances";
import { useCopyTradeFundingStore } from "@/store/copy-trade-funding-store";
import { useCopyTradeStoredSession } from "@/store/copy-trade-store";
import type {
  CopyDepositAddress,
  CopyDepositStatusResult,
} from "@/types/copy-trade-funding";

const STATUS_POLL_INTERVAL_MS = 18_000;

export interface UseCopyTradeDepositOptions {
  open: boolean;
  onCredited?: (creditedPusd: number) => void;
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
  totalBalanceUsd: number;
  balancesLoading: boolean;
  refreshAddress: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  transferDeposit: (amount: string, token: FundingAsset) => Promise<string>;
}

export function useCopyTradeDeposit(
  options: UseCopyTradeDepositOptions,
): UseCopyTradeDepositResult {
  const { open, onCredited } = options;

  const loginMethod = useAuthStore((state) => state.loginMethod);
  const isSocialLogin = loginMethod === "email" || loginMethod === "google";
  const connectedWalletAddress = useAuthStore(
    (state) => state.session?.walletAddress,
  );

  const copyTradeSession = useCopyTradeStoredSession();
  const userId = copyTradeSession?.user?.ID;
  const copyWallet = copyTradeSession?.copyWallet ?? null;
  // Deposits only require the bridge wallet to be deployed with an address;
  // trading approvals (collateral / auto-redeem) are not needed to receive funds.
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

  const chainOptions = useMemo(
    () => getCopyDepositChainOptions(fundingAssets),
    [fundingAssets],
  );

  const { loading: balancesLoading } = useEvmBalances({
    auto: open && !isSocialLogin,
    enabled: open && !isSocialLogin && connectedAssets.length > 0,
    tokens: connectedAssets,
  });

  const evmBalances = useBalancesStore((state) => state.evmBalances);

  const resolveTokenBalance = useCallback(
    (token: FundingAsset) => selectFundingTokenBalanceString(evmBalances, token),
    [evmBalances],
  );

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

    return total.toNumber();
  }, [connectedAssets, evmBalances]);

  const getTokensForChain = useCallback(
    (chainId: number) => getCopyDepositTokensForChain(fundingAssets, chainId),
    [fundingAssets],
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
      if (!connectedWalletAddress) {
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
        walletAddress: connectedWalletAddress,
        chainId: token.chainId,
      });

      const { txHash } = await transferDepositFunds({
        chainType,
        walletAddress: connectedWalletAddress,
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
    [connectedWalletAddress, depositAddress, refreshStatus],
  );

  // Load supported assets and the deposit address when the dialog opens.
  useEffect(() => {
    if (!open || !userId || !walletReady) {
      return;
    }

    void loadDepositAssets();
    void refreshAddress();
  }, [loadDepositAssets, open, refreshAddress, userId, walletReady]);

  // Poll deposit status while the dialog is open.
  useEffect(() => {
    if (!open || !userId || !walletReady) {
      return undefined;
    }

    void refreshStatus();
    pollTimerRef.current = setInterval(() => {
      void refreshStatus();
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open, refreshStatus, userId, walletReady]);

  // Reset transient state when the dialog closes.
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
    totalBalanceUsd,
    balancesLoading,
    refreshAddress,
    refreshStatus,
    transferDeposit,
  };
}
