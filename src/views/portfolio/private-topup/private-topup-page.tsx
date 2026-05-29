"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

import { FUNDING_NETWORKS } from "@/config/funding";
import { MAIN_HOSTNAME } from "@/config/funding";
import { POLYGON_USDC_NATIVE } from "@/lib/funding/stableflow";
import { selectFundingTokenBalanceString } from "@/lib/funding/balance-selectors";
import { fetchEvmTokenBalances } from "@/lib/funding/evm-balances";
import { getTokenUsdValueForTopup } from "@/views/portfolio/private-topup/utils";
import { usePrivateBalances } from "@/hooks/confidential/use-private-balances";
import { usePrices } from "@/hooks/funding";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store/use-prices";
import { getPrivateFundingConnectGate } from "@/context/private-funding-wallet/connect-gate";
import { PrivateTopupProvider, usePrivateTopupContext } from "@/views/portfolio/private-topup/context";
import { HowToUseSection } from "@/views/portfolio/private-topup/how-to-use-section";
import { PrivateAccountCard } from "@/views/portfolio/private-topup/private-account-card";
import { PrivateTopupDialog } from "@/views/portfolio/private-topup/private-topup-dialog";
import {
  privateTopupGetStartedLinkClass,
  privateTopupPageClass,
} from "@/views/portfolio/private-topup/private-topup-ui";
import { TopupWalletCard } from "@/views/portfolio/private-topup/topup-wallet-card";
import type { PrivateTopupSelectableToken } from "@/views/portfolio/private-topup/types";

const POLYGON_USDC_TOKEN: PrivateTopupSelectableToken = {
  ...FUNDING_NETWORKS.polygon,
  assetId: "polygon-usdc",
  blockchain: "pol",
  symbol: "USDC",
  name: "USDC",
  address: POLYGON_USDC_NATIVE,
  decimals: 6,
  icon: "/tokens/usdc.png",
  minCheckoutUsd: 0,
  price: 1,
  chainName: FUNDING_NETWORKS.polygon.chainName,
  chainIcon: FUNDING_NETWORKS.polygon.chainIcon,
};

export function PrivateTopupPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fundingBalanceLoading, setFundingBalanceLoading] = useState(false);
  const setEvmBalances = useBalancesStore((state) => state.setEvmBalances);
  const evmBalances = useBalancesStore((state) => state.evmBalances);
  const prices = usePricesStore((state) => state.prices);

  const {
    account,
    balances,
    loading: confidentialLoading,
    error: confidentialError,
    refresh: refreshPrivateBalances,
    privateAccountAddress,
    privateBalanceUsd,
    ownerWalletAddress,
  } = usePrivateBalances({ auto: true });

  const topupWalletAddress = isConnected ? address : undefined;

  const { loading: pricesLoading } = usePrices({
    auto: Boolean(topupWalletAddress),
    enabled: Boolean(topupWalletAddress),
  });

  const loadFundingBalances = useCallback(async () => {
    if (!topupWalletAddress) {
      return;
    }

    setFundingBalanceLoading(true);

    try {
      const balances = await fetchEvmTokenBalances(topupWalletAddress, [POLYGON_USDC_TOKEN]);
      setEvmBalances({ evmBalances: balances });
    } finally {
      setFundingBalanceLoading(false);
    }
  }, [setEvmBalances, topupWalletAddress]);

  useEffect(() => {
    if (topupWalletAddress) {
      void loadFundingBalances();
    }
  }, [loadFundingBalances, topupWalletAddress]);

  const topupWalletBalanceUsd = topupWalletAddress
    ? getTokenUsdValueForTopup(
        prices,
        POLYGON_USDC_TOKEN,
        selectFundingTokenBalanceString(evmBalances, POLYGON_USDC_TOKEN),
      )
    : 0;

  const handleConnectWallet = useCallback(async () => {
    await getPrivateFundingConnectGate().openConnectAndWait();
  }, []);

  const handleDisconnectWallet = useCallback(async () => {
    await disconnect();
    setDialogOpen(false);
  }, [disconnect]);

  return (
    <PrivateTopupProvider
      value={{
        selectableTokens: [POLYGON_USDC_TOKEN],
        topupWalletAddress,
        privateAccountAddress,
        ownerWalletAddress,
        privateBalanceUsd,
        balancesLoading: confidentialLoading || fundingBalanceLoading,
        pricesLoading,
        refreshPrivateBalance: refreshPrivateBalances,
        topupWalletBalanceUsd,
      }}
    >
      <div className={privateTopupPageClass}>
        <div className="mx-auto flex w-full max-w-[966px] flex-col items-center gap-8">
          <img
            src="/logos/logo-private.svg"
            alt="Private mode"
            className="h-[52px] w-[70px] object-contain"
          />

          {confidentialError ? (
            <p className="m-0 text-center text-sm text-prophet-red">{confidentialError}</p>
          ) : null}

          {!ownerWalletAddress && !confidentialLoading ? (
            <p className="m-0 max-w-[520px] text-center text-sm text-[#909090]">
              Private account session expired. Return to Prophet and continue again.
            </p>
          ) : null}

          <HowToUseSection />

          <PrivateTopupCardsRow
            topupWalletConnected={Boolean(topupWalletAddress)}
            topupWalletAddress={topupWalletAddress}
            privateAccountAddress={privateAccountAddress}
            privateBalanceUsd={privateBalanceUsd}
            accountLoading={confidentialLoading}
            onConnect={() => void handleConnectWallet()}
            onDisconnect={() => void handleDisconnectWallet()}
            onTopUp={() => setDialogOpen(true)}
            onRefreshPrivateBalance={() => void refreshPrivateBalances()}
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

      {topupWalletAddress && ownerWalletAddress && privateAccountAddress ? (
        <PrivateTopupDialog
          open={dialogOpen}
          topupWalletAddress={topupWalletAddress}
          ownerWalletAddress={ownerWalletAddress}
          privateAccountAddress={privateAccountAddress}
          onClose={() => setDialogOpen(false)}
          onSuccess={() => void refreshPrivateBalances()}
        />
      ) : null}
    </PrivateTopupProvider>
  );
}

function PrivateTopupCardsRow({
  topupWalletConnected,
  topupWalletAddress,
  privateAccountAddress,
  privateBalanceUsd,
  accountLoading,
  onConnect,
  onDisconnect,
  onTopUp,
  onRefreshPrivateBalance,
}: {
  topupWalletConnected: boolean;
  topupWalletAddress?: string;
  privateAccountAddress?: string;
  privateBalanceUsd: number;
  accountLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onTopUp: () => void;
  onRefreshPrivateBalance: () => void;
}) {
  const { topupWalletBalanceUsd, balancesLoading, pricesLoading } = usePrivateTopupContext();

  const balanceLoading = balancesLoading || pricesLoading;

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
        balanceLoading={accountLoading}
        topupWalletConnected={topupWalletConnected}
        onTopUp={onTopUp}
        onRefresh={onRefreshPrivateBalance}
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
