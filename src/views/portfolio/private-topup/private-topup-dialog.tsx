"use client";

import type { OneClickStatus, QuoteResponse } from "@stableflow/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import Big from "big.js";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { shouldHideFundingWalletChange } from "@/context/rainbowkit/utils";
import { FundingNetworkType } from "@/config/funding/networks";
import { selectFundingTokenBalanceString } from "@/lib/funding/balance-selectors";
import { fetchEvmTokenBalances } from "@/lib/funding/evm-balances";
import {
  stableflowTokensToFundingTokens,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import { getConfidentialTokens } from "@/lib/confidential/client";
import { useConfidentialTopup } from "@/hooks/confidential/use-confidential-topup";
import { useFundingWalletConnect } from "@/hooks/funding/use-funding-wallet-connect";
import { useSolBalances, useTronBalances } from "@/hooks/funding";
import { useNearBalances } from "@/hooks/funding/use-near-balances";
import { formatShortWallet } from "@/lib/team/detail-format";
import { useBalancesStore } from "@/store/use-balances";
import { PRIVATE_TOPUP_MODAL_WIDTH } from "@/views/portfolio/private-topup/config";
import { PrivateTopupProvider } from "@/views/portfolio/private-topup/context";
import {
  PrivateTopupAmountStep,
  isPrivateTopupAmountStepValid,
} from "@/views/portfolio/private-topup/private-topup-amount-step";
import { PrivateTopupConfirmStep } from "@/views/portfolio/private-topup/private-topup-confirm-step";
import { formatStableflowStatusLabel } from "@/views/portfolio/deposit/deposit-status-step";
import { PrivateTopupTokenStep } from "@/views/portfolio/private-topup/private-topup-token-step";
import { privateTopupWarningBannerClass } from "@/views/portfolio/private-topup/private-topup-ui";
import type {
  PrivateTopupAmountState,
  PrivateTopupSelectableToken,
  PrivateTopupStep,
} from "@/views/portfolio/private-topup/types";
import {
  applyTokenBalancePercent,
  computeUsdFromTokenAmount,
  formatPrivateTopupConnectLabel,
  isPrivateTopupTransferWalletConnected,
  resolvePrivateTopupTransferAddress,
} from "@/views/portfolio/private-topup/utils";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { usePricesStore } from "@/store";
import type { FundingWalletChainType } from "@/store/use-funding-wallet-store";
import {
  getFundingWalletAddress,
  useFundingWalletStore,
} from "@/store/use-funding-wallet-store";

const INITIAL_STEP: PrivateTopupStep = "tokens";

const INITIAL_AMOUNT: PrivateTopupAmountState = {
  amountUsd: "0",
  tokenAmount: "0",
};

type TopupStatusPhase = "bridging" | "success" | "error";

export interface PrivateTopupDialogProps {
  open: boolean;
  topupWalletChainType?: FundingWalletChainType;
  privateAccountAddress: string;
  privateAccountEoaAddress?: string;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

export function PrivateTopupDialog({
  open,
  topupWalletChainType = "evm",
  privateAccountAddress,
  privateAccountEoaAddress,
  onClose,
  onSuccess,
}: PrivateTopupDialogProps) {
  const t = useTranslations("privateTopup");
  const tDeposit = useTranslations("portfolio.deposit");
  const tAuth = useTranslations("auth");
  const tWallet = useTranslations("wallet");
  const { requestQuote, executeTopup, pollTopupStatus, stopStatusPoll } =
    useConfidentialTopup();
  const { connectForToken } = useFundingWalletConnect();

  const handleFundingWalletConnect = useCallback(
    async (token: PrivateTopupSelectableToken) => {
      try {
        await connectForToken(token);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(message);
      }
    },
    [connectForToken],
  );

  const evmFundingAddress = useFundingWalletStore((state) =>
    state.evm.connected ? state.evm.address : undefined,
  );

  const fundingWalletSnapshot = useFundingWalletStore(
    useShallow((state) => ({
      evm: state.evm.connected ? state.evm.address : undefined,
      solana: state.solana.connected ? state.solana.address : undefined,
      tron: state.tron.connected ? state.tron.address : undefined,
      near: state.near.connected ? state.near.address : undefined,
    })),
  );

  const topupWalletAddress = useMemo(() => {
    return getFundingWalletAddress(topupWalletChainType);
  }, [topupWalletChainType, fundingWalletSnapshot]);

  const [step, setStep] = useState<PrivateTopupStep>(INITIAL_STEP);
  const [selectedToken, setSelectedToken] = useState<
    PrivateTopupSelectableToken | undefined
  >();
  const [amount, setAmount] = useState<PrivateTopupAmountState>(INITIAL_AMOUNT);
  const [continueLoading, setContinueLoading] = useState(false);
  const [eoaConfirmed, setEoaConfirmed] = useState(false);
  const [stableflowTokens, setStableflowTokens] = useState<StableflowDepositToken[]>([]);
  const [stableflowTokensLoading, setStableflowTokensLoading] = useState(false);
  const [polygonUsdcDestinationAssetId, setPolygonUsdcDestinationAssetId] =
    useState<string | undefined>();
  const [quote, setQuote] = useState<QuoteResponse | undefined>();
  const [statusPhase, setStatusPhase] = useState<TopupStatusPhase>("bridging");
  const [bridgeStatusLabel, setBridgeStatusLabel] = useState<string | undefined>();
  const [statusError, setStatusError] = useState<string | undefined>();

  const prices = usePricesStore((state) => state.prices);
  const evmBalances = useBalancesStore((state) => state.evmBalances);
  const mergeEvmBalances = useBalancesStore((state) => state.mergeEvmBalances);

  const stableflowFundingTokens = useMemo(
    () => stableflowTokensToFundingTokens(stableflowTokens),
    [stableflowTokens],
  );

  const {
    loading: solBalancesLoading,
    getTokenBalance: getSolTokenBalance,
  } = useSolBalances({
    enabled: open,
    tokens: stableflowFundingTokens,
  });

  const {
    loading: tronBalancesLoading,
    getTokenBalance: getTronTokenBalance,
  } = useTronBalances({
    enabled: open,
    tokens: stableflowFundingTokens,
  });

  const {
    loading: nearBalancesLoading,
    getTokenBalance: getNearTokenBalance,
  } = useNearBalances({
    enabled: open,
    tokens: stableflowTokens,
  });

  const balancesLoading =
    stableflowTokensLoading ||
    solBalancesLoading ||
    tronBalancesLoading ||
    nearBalancesLoading;

  const resolveTokenBalance = useCallback(
    (token: PrivateTopupSelectableToken) => {
      if (token.blockchain === "near") {
        return getNearTokenBalance(token);
      }

      if (token.chainType === FundingNetworkType.SVM) {
        return getSolTokenBalance(token);
      }

      if (token.chainType === FundingNetworkType.TVM) {
        return getTronTokenBalance(token);
      }

      return selectFundingTokenBalanceString(evmBalances, token);
    },
    [evmBalances, getNearTokenBalance, getSolTokenBalance, getTronTokenBalance],
  );

  const selectedTokenMaxAmount = useMemo(() => {
    if (!selectedToken) {
      return "0";
    }

    return resolveTokenBalance(selectedToken);
  }, [resolveTokenBalance, selectedToken]);

  const resolveFundingAddressForToken = useCallback(
    (token: PrivateTopupSelectableToken) =>
      resolvePrivateTopupTransferAddress(token, topupWalletChainType),
    [topupWalletChainType],
  );

  const selectedTokenTransferAddress = useMemo(() => {
    if (!selectedToken) {
      return undefined;
    }

    return resolveFundingAddressForToken(selectedToken);
  }, [resolveFundingAddressForToken, selectedToken, fundingWalletSnapshot]);

  const reset = useCallback(() => {
    setStep(INITIAL_STEP);
    setSelectedToken(undefined);
    setAmount(INITIAL_AMOUNT);
    setEoaConfirmed(false);
    setQuote(undefined);
    setStatusPhase("bridging");
    setBridgeStatusLabel(undefined);
    setStatusError(undefined);
    stopStatusPoll();
  }, [stopStatusPoll]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const loadTokens = useCallback(async () => {
    setStableflowTokensLoading(true);

    try {
      const payload = await getConfidentialTokens();
      setStableflowTokens(payload.tokens);
      setPolygonUsdcDestinationAssetId(payload.polygonUsdcDestinationAssetId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
      throw error;
    } finally {
      setStableflowTokensLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && stableflowTokens.length === 0) {
      void loadTokens();
    }
  }, [loadTokens, open, stableflowTokens.length]);

  useEffect(() => {
    if (!open || stableflowFundingTokens.length === 0 || !evmFundingAddress) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const byChain = await fetchEvmTokenBalances(
          evmFundingAddress,
          stableflowFundingTokens,
        );

        if (active) {
          mergeEvmBalances(byChain);
        }
      } catch {
        // Best-effort balance refresh.
      }
    })();

    return () => {
      active = false;
    };
  }, [evmFundingAddress, mergeEvmBalances, open, stableflowFundingTokens]);

  const ariaLabel = useMemo(() => {
    switch (step) {
      case "tokens":
        return t("ariaSelectTopUpAsset");
      case "amount":
        return t("ariaEnterTopUpAmount");
      case "confirm":
        return t("ariaConfirmPrivateTopUp");
      case "status":
        return t("ariaTopUpStatus");
      default:
        return t("ariaPrivateTopUp");
    }
  }, [step, t]);

  function handleBack() {
    if (step === "amount") {
      setStep("tokens");
      setAmount(INITIAL_AMOUNT);
      return;
    }

    if (step === "confirm") {
      setStep("amount");
      return;
    }

    if (step === "status") {
      setStep("confirm");
      stopStatusPoll();
    }
  }

  const showBack = step !== "tokens" && step !== "status";

  const onContinueToAmount = () => {
    if (!selectedToken) {
      return;
    }

    const max = selectedTokenMaxAmount;

    if (Big(max || 0).gt(0)) {
      const tokenAmount = applyTokenBalancePercent(max, 100, selectedToken.decimals);
      const amountUsd = computeUsdFromTokenAmount(tokenAmount, prices, selectedToken);
      setAmount({ tokenAmount, amountUsd });
    } else {
      setAmount(INITIAL_AMOUNT);
    }

    setStep("amount");
  };

  const onContinueToConfirm = async () => {
    if (!selectedToken || !polygonUsdcDestinationAssetId) {
      return;
    }

    setContinueLoading(true);
    setEoaConfirmed(false);

    try {
      const fundingAddress = resolveFundingAddressForToken(selectedToken);

      if (!fundingAddress) {
        toast.error(formatPrivateTopupConnectLabel(tWallet, selectedToken));
        return;
      }

      const nextQuote = await requestQuote({
        token: selectedToken,
        tokenAmount: amount.tokenAmount,
        fundingAddress,
        destinationAssetId: polygonUsdcDestinationAssetId,
      });
      setQuote(nextQuote);
      setStep("confirm");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setContinueLoading(false);
    }
  };

  const runStatusPolling = useCallback(
    async (depositAddress: string, depositMemo: string | undefined) => {
      try {
        setStatusPhase("bridging");
        await pollTopupStatus(depositAddress, depositMemo, (status: OneClickStatus) => {
          setBridgeStatusLabel(formatStableflowStatusLabel(status, tDeposit));
        });
        setStatusPhase("success");
        toast.success(t("topUpSuccessful"));
        await onSuccess?.();
      } catch (error) {
        setStatusPhase("error");
        setStatusError(error instanceof Error ? error.message : String(error));
      }
    },
    [onSuccess, pollTopupStatus, t, tDeposit],
  );

  const onConfirmTopup = async () => {
    if (!selectedToken || !quote) {
      toast.error(t("notReady"));
      return;
    }

    setContinueLoading(true);
    setStatusError(undefined);
    setStep("status");
    setStatusPhase("bridging");

    try {
      const fundingAddress = resolveFundingAddressForToken(selectedToken);

      if (!fundingAddress) {
        toast.error(t("notReady"));
        return;
      }

      const execution = await executeTopup({
        token: selectedToken,
        tokenAmount: amount.tokenAmount,
        fundingAddress,
        quote,
      });
      void runStatusPolling(execution.depositAddress, execution.depositMemo);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusPhase("error");
      setStatusError(message);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const footer = useMemo(() => {
    if (step === "status") {
      return undefined;
    }

    if (step === "tokens") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!selectedToken || continueLoading}
          onClick={onContinueToAmount}
        >
          {tAuth("continue")}
        </button>
      );
    }

    if (step === "amount" && selectedToken) {
      const transferConnected = isPrivateTopupTransferWalletConnected(
        selectedToken,
        topupWalletChainType,
      );

      if (!transferConnected) {
        return (
          <button
            type="button"
            className={fundingPrimaryButtonClass}
            disabled={continueLoading}
            onClick={() => void handleFundingWalletConnect(selectedToken)}
          >
            {continueLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {formatPrivateTopupConnectLabel(tWallet, selectedToken)}
          </button>
        );
      }

      const canContinue = isPrivateTopupAmountStepValid(
        amount.tokenAmount,
        selectedTokenMaxAmount,
      );

      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!canContinue || continueLoading}
          onClick={() => void onContinueToConfirm()}
        >
          {continueLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tAuth("continue")}
        </button>
      );
    }

    if (step === "confirm") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={continueLoading || !quote || !eoaConfirmed}
          onClick={() => void onConfirmTopup()}
        >
          {continueLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("confirmTopUp")}
        </button>
      );
    }

    return undefined;
  }, [
    amount.tokenAmount,
    continueLoading,
    eoaConfirmed,
    handleFundingWalletConnect,
    onConfirmTopup,
    onContinueToConfirm,
    quote,
    selectedToken,
    selectedTokenMaxAmount,
    step,
    topupWalletChainType,
    fundingWalletSnapshot,
    t,
    tAuth,
    tWallet,
  ]);

  const shellMinHeight =
    step === "confirm"
      ? "min-h-0 md:min-h-[600px]"
      : step === "amount"
        ? "min-h-0 md:min-h-[480px]"
        : "min-h-0 md:min-h-[515px]";

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={handleClose}
      ariaLabel={ariaLabel}
      className={PRIVATE_TOPUP_MODAL_WIDTH}
      hideCloseButton
      overlayCloseable={false}
    >
      <PrivateTopupProvider
        value={{
          selectableTokens: stableflowTokens,
          topupWalletAddress,
          privateAccountAddress,
          primaryChainType: topupWalletChainType,
          balancesLoading,
          pricesLoading: false,
          getNearTokenBalance,
          getSolTokenBalance,
          getTronTokenBalance,
        }}
      >
        <FundingModalShell
          title={t("titleTopUpPrivateBalance")}
          onClose={handleClose}
          onBack={showBack ? handleBack : undefined}
          footer={footer}
          className={shellMinHeight}
        >
          {step === "tokens" ? (
            <PrivateTopupTokenStep
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
              onChangeWallet={handleClose}
              showChangeWallet={!shouldHideFundingWalletChange()}
            />
          ) : null}

          {step === "amount" && selectedToken ? (
            <PrivateTopupAmountStep
              key={`${selectedToken.chainId}-${selectedToken.address}`}
              token={selectedToken}
              amount={amount}
              maxAmount={selectedTokenMaxAmount}
              transferWalletAddress={selectedTokenTransferAddress}
              onAmountChange={setAmount}
            />
          ) : null}

          {step === "confirm" && selectedToken ? (
            <div className="flex flex-col gap-4">
              <label
                className={`${privateTopupWarningBannerClass} cursor-pointer items-start`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-black"
                  checked={eoaConfirmed}
                  onChange={(event) => setEoaConfirmed(event.target.checked)}
                />
                <span>
                  {t("confirmPrivateAccountLinked", {
                    address: privateAccountEoaAddress
                      ? ` ${formatShortWallet(privateAccountEoaAddress)}`
                      : "",
                  })}
                </span>
              </label>
              <PrivateTopupConfirmStep
                topupWalletAddress={selectedToken ? resolveFundingAddressForToken(selectedToken) ?? "" : ""}
                privateAccountAddress={privateAccountAddress}
                token={selectedToken}
                tokenAmount={amount.tokenAmount}
                amountUsd={amount.amountUsd}
                stableflowQuote={quote}
              />
            </div>
          ) : null}

          {step === "status" ? (
            <TopupStatusView
              phase={statusPhase}
              bridgeStatusLabel={bridgeStatusLabel}
              error={statusError}
              onDone={handleClose}
              onRetry={() => setStep("confirm")}
            />
          ) : null}
        </FundingModalShell>
      </PrivateTopupProvider>
    </FundingResponsiveOverlay>
  );
}

function TopupStatusView({
  phase,
  bridgeStatusLabel,
  error,
  onDone,
  onRetry,
}: {
  phase: TopupStatusPhase;
  bridgeStatusLabel?: string;
  error?: string;
  onDone: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations("privateTopup");
  const tAuth = useTranslations("auth");

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
      {phase === "bridging" ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-black" aria-hidden />
          <div>
            <p className="m-0 text-lg font-[556] text-black">
              {t("movingFunds")}
            </p>
            <p className="m-0 mt-1 text-sm text-[#909090]">
              {bridgeStatusLabel ?? t("bridgeStatusFallback")}
            </p>
          </div>
        </>
      ) : null}

      {phase === "success" ? (
        <>
          <CheckCircle2 className="h-10 w-10 text-[#16a34a]" aria-hidden />
          <div>
            <p className="m-0 text-lg font-[556] text-black">{t("topUpComplete")}</p>
            <p className="m-0 mt-1 text-sm text-[#909090]">
              {t("topUpCompleteBody")}
            </p>
          </div>
          <button type="button" className={fundingPrimaryButtonClass} onClick={onDone}>
            {tAuth("done")}
          </button>
        </>
      ) : null}

      {phase === "error" ? (
        <>
          <ShieldAlert className="h-10 w-10 text-[#e5484d]" aria-hidden />
          <div>
            <p className="m-0 text-lg font-[556] text-black">{t("topUpFailed")}</p>
            <p className="m-0 mt-1 text-sm text-[#e5484d]">
              {error ?? t("somethingWentWrong")}
            </p>
          </div>
          <button type="button" className={fundingPrimaryButtonClass} onClick={onRetry}>
            {t("tryAgain")}
          </button>
        </>
      ) : null}
    </div>
  );
}
