"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  stableflowTokensToFundingTokens,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import { fetchEvmTokenBalances } from "@/lib/funding/evm-balances";
import { getConfidentialTokens } from "@/lib/confidential/client";
import { usePrices } from "@/hooks/funding";
import { useFundingWallet } from "@/hooks/confidential/use-funding-wallet";
import { useBalancesStore } from "@/store/use-balances";
import { formatShortWallet } from "@/lib/team/detail-format";
import { PrivateTopupProvider, usePrivateTopupContext } from "@/views/portfolio/private-topup/context";
import { HowToUseSection } from "@/views/portfolio/private-topup/how-to-use-section";
import { PrivateAccountCard } from "@/views/portfolio/private-topup/private-account-card";
import { PrivateTopupDialog } from "@/views/portfolio/private-topup/private-topup-dialog";
import {
  privateTopupGetStartedLinkClass,
  privateTopupInfoBannerClass,
  privateTopupPageClass,
  privateTopupWarningBannerClass,
} from "@/views/portfolio/private-topup/private-topup-ui";
import { PrivateTopupChainPicker } from "@/views/portfolio/private-topup/private-topup-chain-picker";
import { TopupWalletCard } from "@/views/portfolio/private-topup/topup-wallet-card";
import { useSolBalances, useTronBalances } from "@/hooks/funding";
import { useNearBalances } from "@/hooks/funding/use-near-balances";
import type { FundingWalletChainType } from "@/store/use-funding-wallet-store";
import {
  getFundingWalletAddress,
  useFundingWalletStore,
} from "@/store/use-funding-wallet-store";
import { MAIN_HOSTNAME } from "@/config/funding";
import { TP_FUNDING_SWITCH_EVENT } from "@/lib/wallet/tokenpocket/constants";
import type { TpFundingSwitchCompleteDetail } from "@/lib/wallet/tokenpocket/tp-funding-switch";
import { useAuth } from "@/context/auth";

export function PrivateTopupPage() {
  const t = useTranslations("privateTopup");
  const fundingWallet = useFundingWallet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chainPickerOpen, setChainPickerOpen] = useState(false);
  const [stableflowTokens, setStableflowTokens] = useState<StableflowDepositToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const setEvmBalances = useBalancesStore((state) => state.setEvmBalances);
  const clearEvmBalances = useBalancesStore((state) => state.clearEvmBalances);
  const { refreshPrivateBalance, privateBalance, privateBalanceStatus, confidentialAccount } = useAuth();

  const topupWalletConnected = fundingWallet.connected;
  const topupWalletAddress = fundingWallet.address;
  const privateAccountAddress = confidentialAccount.intentsUserId;

  const privateBalanceUsd = privateBalance?.usd ?? 0;

  const stableflowFundingTokens = useMemo(
    () => stableflowTokensToFundingTokens(stableflowTokens),
    [stableflowTokens],
  );

  const loadTokens = useCallback(async () => {
    setTokensLoading(true);

    try {
      const payload = await getConfidentialTokens();
      setStableflowTokens(payload.tokens);
    } catch {
      setStableflowTokens([]);
    } finally {
      setTokensLoading(false);
    }
  }, []);

  useEffect(() => {
    if (topupWalletConnected) {
      void loadTokens();
    }
  }, [loadTokens, topupWalletConnected]);

  const { loading: pricesLoading } = usePrices({
    auto: topupWalletConnected,
    enabled: topupWalletConnected,
  });

  const evmFundingAddress = useFundingWalletStore((state) =>
    state.evm.connected ? state.evm.address : undefined,
  );

  const {
    loading: solBalancesLoading,
    getTokenBalance: getSolTokenBalance,
    refresh: refreshSolBalances,
  } = useSolBalances({
    enabled: topupWalletConnected,
    tokens: stableflowFundingTokens,
  });

  const {
    loading: tronBalancesLoading,
    getTokenBalance: getTronTokenBalance,
    refresh: refreshTronBalances,
  } = useTronBalances({
    enabled: topupWalletConnected,
    tokens: stableflowFundingTokens,
  });

  const {
    loading: nearBalancesLoading,
    getTokenBalance: getNearTokenBalance,
    refresh: refreshNearBalances,
  } = useNearBalances({
    enabled: topupWalletConnected,
    tokens: stableflowTokens,
  });

  const loadFundingBalances = useCallback(async () => {
    const evmAddress = getFundingWalletAddress("evm");

    if (!evmAddress || stableflowFundingTokens.length === 0) {
      return;
    }

    try {
      const byChain = await fetchEvmTokenBalances(evmAddress, stableflowFundingTokens);
      setEvmBalances({ evmBalances: byChain });
    } catch {
      // Balance fetch is best-effort; the UI shows "--" on failure.
    }
  }, [setEvmBalances, stableflowFundingTokens]);

  useEffect(() => {
    if (topupWalletConnected && evmFundingAddress) {
      void loadFundingBalances();
    } else if (!topupWalletConnected) {
      clearEvmBalances();
    }
  }, [clearEvmBalances, evmFundingAddress, loadFundingBalances, topupWalletConnected]);

  function handleConnectWallet() {
    setChainPickerOpen(true);
  }

  function handleSelectFundingChain(chainType: FundingWalletChainType) {
    void fundingWallet.connect(chainType);
  }

  function handleDisconnectWallet() {
    void fundingWallet.disconnect();
    setDialogOpen(false);
  }

  const handleTopupSuccess = useCallback(async () => {
    await refreshPrivateBalance({ requiredSession: false });
    await Promise.all([
      loadFundingBalances(),
      refreshSolBalances(),
      refreshTronBalances(),
      refreshNearBalances(),
    ]);
  }, [
    loadFundingBalances,
    refreshNearBalances,
    refreshPrivateBalance,
    refreshSolBalances,
    refreshTronBalances,
  ]);

  useEffect(() => {
    void refreshPrivateBalance({ requiredSession: false });
  }, [refreshPrivateBalance]);

  useEffect(() => {
    const handleFundingSwitchComplete = (event: Event) => {
      const detail = (event as CustomEvent<TpFundingSwitchCompleteDetail>).detail;

      if (detail.hostKind !== "private") {
        return;
      }

      void refreshPrivateBalance({ requiredSession: false });

      if (!fundingWallet.connected) {
        toast.message(
          "Page reloaded in TokenPocket. Reconnect your funding wallet to continue the top up.",
        );
        setChainPickerOpen(true);
      }
    };

    window.addEventListener(TP_FUNDING_SWITCH_EVENT, handleFundingSwitchComplete);

    return () => {
      window.removeEventListener(TP_FUNDING_SWITCH_EVENT, handleFundingSwitchComplete);
    };
  }, [fundingWallet.connected, refreshPrivateBalance]);

  return (
    <PrivateTopupProvider
      value={{
        selectableTokens: stableflowTokens,
        topupWalletAddress,
        privateAccountAddress,
        primaryChainType: fundingWallet.chainType,
        balancesLoading:
          tokensLoading || solBalancesLoading || tronBalancesLoading || nearBalancesLoading,
        pricesLoading,
        getNearTokenBalance,
        getSolTokenBalance,
        getTronTokenBalance,
      }}
    >
      <div className={privateTopupPageClass}>
        <div className="mx-auto flex w-full max-w-[966px] flex-col items-center gap-8">
          <img
            src="/logos/logo-private.svg"
            alt={t("privateModeAlt")}
            className="h-[52px] w-[70px] object-contain"
          />

          <HowToUseSection />

          {confidentialAccount.authenticated && confidentialAccount.eoaAddress ? (
            <p className={`${privateTopupInfoBannerClass} w-full`}>
              {t("linkedAccountBanner", {
                address: formatShortWallet(confidentialAccount.eoaAddress),
              })}
            </p>
          ) : !confidentialAccount.loading ? (
            <div className={`${privateTopupWarningBannerClass} w-full justify-center`}>
              <span>{t("noVerifiedAccount")}</span>
            </div>
          ) : null}

          <PrivateTopupCardsRow
            topupWalletConnected={topupWalletConnected}
            topupWalletAddress={topupWalletAddress}
            topupWalletChainType={fundingWallet.chainType}
            tokensLoading={tokensLoading}
            onConnect={handleConnectWallet}
            onDisconnect={handleDisconnectWallet}
            privateAccountAddress={privateAccountAddress}
            privateBalanceUsd={privateBalanceUsd}
            privateBalanceLoading={privateBalanceStatus === "loading"}
            onRefreshPrivateBalance={() => refreshPrivateBalance({ requiredSession: false })}
            onTopUp={() => setDialogOpen(true)}
          />

          <Link
            href={`https://${MAIN_HOSTNAME}/fifa`}
            className={privateTopupGetStartedLinkClass}
          >
            <span>{t("startsToGetProphet")}</span>
            <ChevronRight aria-hidden />
          </Link>
        </div>
      </div>

      {topupWalletConnected && privateAccountAddress ? (
        <PrivateTopupDialog
          open={dialogOpen}
          topupWalletChainType={fundingWallet.chainType}
          privateAccountAddress={privateAccountAddress}
          privateAccountEoaAddress={confidentialAccount.eoaAddress}
          onClose={() => setDialogOpen(false)}
          onSuccess={handleTopupSuccess}
        />
      ) : null}
      <PrivateTopupChainPicker
        open={chainPickerOpen}
        onClose={() => setChainPickerOpen(false)}
        onSelect={handleSelectFundingChain}
      />
    </PrivateTopupProvider>
  );
}

function PrivateTopupCardsRow({
  topupWalletConnected,
  topupWalletAddress,
  topupWalletChainType,
  tokensLoading,
  onConnect,
  onDisconnect,
  privateAccountAddress,
  privateBalanceUsd,
  privateBalanceLoading,
  onRefreshPrivateBalance,
  onTopUp,
}: {
  topupWalletConnected: boolean;
  topupWalletAddress?: string;
  topupWalletChainType?: FundingWalletChainType;
  tokensLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  privateAccountAddress?: string;
  privateBalanceUsd: number;
  privateBalanceLoading: boolean;
  onRefreshPrivateBalance: () => void;
  onTopUp: () => void;
}) {
  const {
    topupWalletBalanceUsd,
    balancesLoading,
    pricesLoading
  } = usePrivateTopupContext();

  const balanceLoading = tokensLoading || balancesLoading || pricesLoading;

  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,371px)_1fr]">
      <TopupWalletCard
        connected={topupWalletConnected}
        address={topupWalletAddress}
        chainType={topupWalletChainType}
        balanceUsd={topupWalletBalanceUsd}
        balanceLoading={balanceLoading}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
      <PrivateAccountCard
        address={privateAccountAddress}
        privateBalanceUsd={privateBalanceUsd}
        privateBalanceLoading={privateBalanceLoading}
        topupWalletConnected={topupWalletConnected}
        onRefresh={onRefreshPrivateBalance}
        onTopUp={onTopUp}
      />
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="5"
      height="11"
      viewBox="0 0 5 11"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 1L4 5.5L1 10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
