"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  stableflowTokensToFundingTokens,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import { fetchEvmTokenBalances } from "@/lib/funding/evm-balances";
import { getConfidentialTokens } from "@/lib/confidential/client";
import { usePrices } from "@/hooks/funding";
import { useConfidentialAccount } from "@/hooks/confidential/use-confidential-account";
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
import { TopupWalletCard } from "@/views/portfolio/private-topup/topup-wallet-card";
import { MAIN_HOSTNAME } from "@/config/funding";
import { useAuth } from "@/context/auth";

export function PrivateTopupPage() {
  const fundingWallet = useFundingWallet();
  const account = useConfidentialAccount();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stableflowTokens, setStableflowTokens] = useState<StableflowDepositToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const setEvmBalances = useBalancesStore((state) => state.setEvmBalances);
  const clearEvmBalances = useBalancesStore((state) => state.clearEvmBalances);
  const { refreshPrivateBalance, privateBalance, privateBalanceStatus } = useAuth();

  const topupWalletConnected = fundingWallet.connected;
  const topupWalletAddress = fundingWallet.address;
  const privateAccountAddress = account.intentsUserId;

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

  const loadFundingBalances = useCallback(async () => {
    if (!topupWalletAddress || stableflowFundingTokens.length === 0) {
      return;
    }

    try {
      const byChain = await fetchEvmTokenBalances(topupWalletAddress, stableflowFundingTokens);
      setEvmBalances({ evmBalances: byChain });
    } catch {
      // Balance fetch is best-effort; the UI shows "--" on failure.
    }
  }, [setEvmBalances, stableflowFundingTokens, topupWalletAddress]);

  useEffect(() => {
    if (topupWalletConnected && topupWalletAddress) {
      void loadFundingBalances();
    } else if (!topupWalletConnected) {
      clearEvmBalances();
    }
  }, [clearEvmBalances, loadFundingBalances, topupWalletAddress, topupWalletConnected]);

  function handleConnectWallet() {
    void fundingWallet.connect();
  }

  function handleDisconnectWallet() {
    void fundingWallet.disconnect();
    setDialogOpen(false);
  }

  const handleTopupSuccess = useCallback(async () => {
    await refreshPrivateBalance();
    await loadFundingBalances();
  }, [refreshPrivateBalance, loadFundingBalances]);

  return (
    <PrivateTopupProvider
      value={{
        selectableTokens: stableflowTokens,
        topupWalletAddress,
        privateAccountAddress,
        balancesLoading: tokensLoading,
        pricesLoading,
      }}
    >
      <div className={privateTopupPageClass}>
        <div className="mx-auto flex w-full max-w-[966px] flex-col items-center gap-8">
          <img
            src="/logos/logo-private.svg"
            alt="Private mode"
            className="h-[52px] w-[70px] object-contain"
          />

          <HowToUseSection />

          {account.authenticated && account.eoaAddress ? (
            <p className={`${privateTopupInfoBannerClass} w-full`}>
              This Private Account is linked to your wallet {formatShortWallet(account.eoaAddress)}.
              Confirm this is correct before funding.
            </p>
          ) : !account.loading ? (
            <div className={`${privateTopupWarningBannerClass} w-full justify-center`}>
              <span>
                No verified Private Account found. Start Private Mode from the main site to continue.
              </span>
            </div>
          ) : null}

          <PrivateTopupCardsRow
            topupWalletConnected={topupWalletConnected}
            topupWalletAddress={topupWalletAddress}
            tokensLoading={tokensLoading}
            onConnect={handleConnectWallet}
            onDisconnect={handleDisconnectWallet}
            privateAccountAddress={privateAccountAddress}
            privateBalanceUsd={privateBalanceUsd}
            privateBalanceLoading={privateBalanceStatus === "loading"}
            onRefreshPrivateBalance={() => refreshPrivateBalance()}
            onTopUp={() => setDialogOpen(true)}
          />

          <Link
            href={`https://${MAIN_HOSTNAME}/fifa`}
            className={privateTopupGetStartedLinkClass}
          >
            <span>Starts to get Prophet</span>
            <ChevronRight aria-hidden />
          </Link>
        </div>
      </div>

      {topupWalletAddress && privateAccountAddress ? (
        <PrivateTopupDialog
          open={dialogOpen}
          topupWalletAddress={topupWalletAddress}
          privateAccountAddress={privateAccountAddress}
          privateAccountEoaAddress={account.eoaAddress}
          onClose={() => setDialogOpen(false)}
          onSuccess={handleTopupSuccess}
        />
      ) : null}
    </PrivateTopupProvider>
  );
}

function PrivateTopupCardsRow({
  topupWalletConnected,
  topupWalletAddress,
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
  tokensLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  privateAccountAddress?: string;
  privateBalanceUsd: number;
  privateBalanceLoading: boolean;
  onRefreshPrivateBalance: () => void;
  onTopUp: () => void;
}) {
  const { topupWalletBalanceUsd, balancesLoading, pricesLoading } =
    usePrivateTopupContext();

  const balanceLoading = tokensLoading || balancesLoading || pricesLoading;

  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,371px)_1fr]">
      <TopupWalletCard
        connected={topupWalletConnected}
        address={topupWalletAddress}
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
