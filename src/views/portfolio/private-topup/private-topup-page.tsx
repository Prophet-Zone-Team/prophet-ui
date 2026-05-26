"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth";
import {
  stableflowTokensToFundingTokens,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import { fetchJson } from "@/lib/team/client-fetch";
import { useEvmBalances, usePrices } from "@/hooks/funding";
import { PrivateTopupProvider, usePrivateTopupContext } from "@/views/portfolio/private-topup/context";
import { HowToUseSection } from "@/views/portfolio/private-topup/how-to-use-section";
import { PrivateAccountCard } from "@/views/portfolio/private-topup/private-account-card";
import { PrivateTopupDialog } from "@/views/portfolio/private-topup/private-topup-dialog";
import {
  privateTopupGetStartedLinkClass,
  privateTopupPageClass,
} from "@/views/portfolio/private-topup/private-topup-ui";
import { TopupWalletCard } from "@/views/portfolio/private-topup/topup-wallet-card";

export function PrivateTopupPage() {
  const { session } = useAuth();
  const [topupWalletConnected, setTopupWalletConnected] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stableflowTokens, setStableflowTokens] = useState<
    StableflowDepositToken[]
  >([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  const topupWalletAddress = topupWalletConnected
    ? session?.walletAddress
    : undefined;
  const privateAccountAddress = session?.funderAddress;

  const stableflowFundingTokens = useMemo(
    () => stableflowTokensToFundingTokens(stableflowTokens),
    [stableflowTokens],
  );

  const loadTokens = useCallback(async () => {
    setTokensLoading(true);

    try {
      const payload = await fetchJson<{ tokens: StableflowDepositToken[] }>(
        "/api/trading/stableflow/tokens",
      );
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

  useEvmBalances({
    auto: topupWalletConnected,
    enabled: topupWalletConnected && stableflowFundingTokens.length > 0,
    tokens: stableflowFundingTokens,
    merge: true,
  });

  function handleConnectWallet() {
    if (!session?.walletAddress) {
      return;
    }

    setTopupWalletConnected(true);
  }

  function handleDisconnectWallet() {
    setTopupWalletConnected(false);
    setDialogOpen(false);
  }

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

          <PrivateTopupCardsRow
            topupWalletConnected={topupWalletConnected}
            topupWalletAddress={topupWalletAddress}
            tokensLoading={tokensLoading}
            onConnect={handleConnectWallet}
            onDisconnect={handleDisconnectWallet}
            privateAccountAddress={privateAccountAddress}
            onTopUp={() => setDialogOpen(true)}
          />

          <Link href="/fifa" className={privateTopupGetStartedLinkClass}>
            <span>Starts to get Prophet</span>
            <ChevronRight aria-hidden />
          </Link>
        </div>
      </div>

      {topupWalletAddress ? (
        <PrivateTopupDialog
          open={dialogOpen}
          topupWalletAddress={topupWalletAddress}
          onClose={() => setDialogOpen(false)}
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
  onTopUp,
}: {
  topupWalletConnected: boolean;
  topupWalletAddress?: string;
  tokensLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  privateAccountAddress?: string;
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
        privateBalanceUsd={0}
        topupWalletConnected={topupWalletConnected}
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
