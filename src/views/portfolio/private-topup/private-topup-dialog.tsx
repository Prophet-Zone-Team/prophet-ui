"use client";

import type { OneClickStatus, QuoteResponse } from "@stableflow/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Big from "big.js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@/components/ui/modal";
import { FundingNetworkType } from "@/config/funding";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import { selectFundingTokenBalanceString } from "@/lib/funding/balance-selectors";
import {
  stableflowTokensToFundingTokens,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import {
  executePendingDepositConvert,
  getPendingConvertAmountUsd,
  resolvePendingDepositConvertMode,
  type FunderCollateralBalances,
} from "@/lib/trading/deposit-wallet-convert";
import { useDeposit, useEvmBalances, usePrices } from "@/hooks/funding";
import { useAuth } from "@/context/auth";
import { fetchJson } from "@/lib/team/client-fetch";
import { useBalancesStore } from "@/store/use-balances";
import { PRIVATE_TOPUP_MODAL_WIDTH } from "@/views/portfolio/private-topup/config";
import { PrivateTopupProvider } from "@/views/portfolio/private-topup/context";
import {
  PrivateTopupAmountStep,
  isPrivateTopupAmountStepValid,
} from "@/views/portfolio/private-topup/private-topup-amount-step";
import { PrivateTopupConfirmStep } from "@/views/portfolio/private-topup/private-topup-confirm-step";
import {
  DepositStatusStep,
  formatStableflowStatusLabel,
} from "@/views/portfolio/deposit/deposit-status-step";
import { PrivateTopupTokenStep } from "@/views/portfolio/private-topup/private-topup-token-step";
import type {
  DepositStatusPhase,
  PrivateTopupAmountState,
  PrivateTopupSelectableToken,
  PrivateTopupStep,
  StableflowDepositContext,
} from "@/views/portfolio/private-topup/types";
import {
  applyTokenBalancePercent,
  computeUsdFromTokenAmount,
} from "@/views/portfolio/private-topup/utils";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { usePricesStore } from "@/store";

const INITIAL_STEP: PrivateTopupStep = "tokens";

const INITIAL_AMOUNT: PrivateTopupAmountState = {
  amountUsd: "0",
  tokenAmount: "0",
};

export interface PrivateTopupDialogProps {
  open: boolean;
  topupWalletAddress: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PrivateTopupDialog({
  open,
  topupWalletAddress,
  onClose,
  onSuccess,
}: PrivateTopupDialogProps) {
  const { session, syncCash } = useAuth();

  const [step, setStep] = useState<PrivateTopupStep>(INITIAL_STEP);
  const [selectedToken, setSelectedToken] = useState<
    PrivateTopupSelectableToken | undefined
  >();
  const [amount, setAmount] = useState<PrivateTopupAmountState>(INITIAL_AMOUNT);
  const [continueLoading, setContinueLoading] = useState(false);
  const [stableflowTokens, setStableflowTokens] = useState<
    StableflowDepositToken[]
  >([]);
  const [stableflowTokensLoading, setStableflowTokensLoading] = useState(false);
  const [polygonUsdcDestinationAssetId, setPolygonUsdcDestinationAssetId] =
    useState<string | undefined>();
  const [stableflowQuote, setStableflowQuote] = useState<
    QuoteResponse | undefined
  >();
  const [stableflowExecution, setStableflowExecution] = useState<
    StableflowDepositContext | undefined
  >();
  const [statusPhase, setStatusPhase] =
    useState<DepositStatusPhase>("bridging");
  const [bridgeStatusLabel, setBridgeStatusLabel] = useState<
    string | undefined
  >();
  const [convertStatusLabel, setConvertStatusLabel] = useState<
    string | undefined
  >();
  const [detectedUsdcAmount, setDetectedUsdcAmount] = useState<
    string | undefined
  >();
  const [detectedUsdceAmount, setDetectedUsdceAmount] = useState<
    string | undefined
  >();
  const [funderCollateralBalances, setFunderCollateralBalances] =
    useState<FunderCollateralBalances | null>(null);
  const [statusError, setStatusError] = useState<string | undefined>();
  const statusPollAbortRef = useRef<AbortController | undefined>(undefined);

  const prices = usePricesStore((state) => state.prices);

  const {
    depositViaStableflow,
    pollStableflowBridge,
    pollFunderCollateralBalances,
    stopStatusPoll,
  } = useDeposit();

  const { loading: pricesLoading } = usePrices({
    auto: open,
    enabled: open,
  });

  const pendingConvertMode = funderCollateralBalances
    ? resolvePendingDepositConvertMode(funderCollateralBalances)
    : null;

  const stableflowFundingTokens = useMemo(
    () => stableflowTokensToFundingTokens(stableflowTokens),
    [stableflowTokens],
  );

  useEvmBalances({
    auto: open,
    enabled: open && stableflowFundingTokens.length > 0,
    tokens: stableflowFundingTokens,
    merge: true,
  });

  const evmBalances = useBalancesStore((state) => state.evmBalances);
  const balancesLoading = stableflowTokensLoading;

  const selectedTokenMaxAmount = useMemo(() => {
    if (!selectedToken) {
      return "0";
    }

    return selectFundingTokenBalanceString(evmBalances, selectedToken);
  }, [evmBalances, selectedToken]);

  const reset = useCallback(() => {
    setStep(INITIAL_STEP);
    setSelectedToken(undefined);
    setAmount(INITIAL_AMOUNT);
    setStableflowQuote(undefined);
    setStableflowExecution(undefined);
    setStatusPhase("bridging");
    setBridgeStatusLabel(undefined);
    setConvertStatusLabel(undefined);
    setDetectedUsdcAmount(undefined);
    setDetectedUsdceAmount(undefined);
    setFunderCollateralBalances(null);
    setStatusError(undefined);
    statusPollAbortRef.current?.abort();
    statusPollAbortRef.current = undefined;
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

  const loadStableflowTokens = useCallback(async () => {
    setStableflowTokensLoading(true);

    try {
      const payload = await fetchJson<{
        tokens: StableflowDepositToken[];
        polygonUsdcDestinationAssetId: string;
      }>("/api/trading/stableflow/tokens");

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
      void loadStableflowTokens();
    }
  }, [loadStableflowTokens, open, stableflowTokens.length]);

  const ariaLabel = useMemo(() => {
    switch (step) {
      case "tokens":
        return "Select top up asset";
      case "amount":
        return "Enter top up amount";
      case "confirm":
        return "Confirm private top up";
      case "status":
        return "Top up status";
      default:
        return "Private top up";
    }
  }, [step]);

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
      statusPollAbortRef.current?.abort();
      statusPollAbortRef.current = undefined;
    }
  }

  const showBack = step !== "tokens";

  const onContinueToAmount = () => {
    if (!selectedToken) {
      return;
    }

    const max = selectedTokenMaxAmount;
    if (Big(max || 0).gt(0)) {
      const tokenAmount = applyTokenBalancePercent(
        max,
        100,
        selectedToken.decimals,
      );
      const amountUsd = computeUsdFromTokenAmount(
        tokenAmount,
        prices,
        selectedToken,
      );
      setAmount({ tokenAmount, amountUsd });
    } else {
      setAmount(INITIAL_AMOUNT);
    }

    setStep("amount");
  };

  const onContinueToConfirm = async () => {
    if (!selectedToken || !session?.funderAddress) {
      return;
    }

    setContinueLoading(true);

    try {
      const amountBaseUnits = Big(amount.tokenAmount)
        .times(10 ** selectedToken.decimals)
        .toFixed(0, 0);
      const { quote } = await fetchJson<{ quote: QuoteResponse }>(
        "/api/trading/stableflow/quote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originAssetId: selectedToken.assetId,
            destinationAssetId: polygonUsdcDestinationAssetId,
            amountBaseUnits,
            refundTo: topupWalletAddress,
            recipient: session.funderAddress,
          }),
        },
      );
      setStableflowQuote(quote);
      setStep("confirm");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const runStatusPolling = useCallback(
    async (execution: StableflowDepositContext) => {
      statusPollAbortRef.current?.abort();
      const controller = new AbortController();
      statusPollAbortRef.current = controller;

      try {
        if (!execution.skipBridgePoll && execution.depositAddress) {
          setStatusPhase("bridging");
          await pollStableflowBridge(
            execution.depositAddress,
            execution.depositMemo,
            (status: OneClickStatus) => {
              setBridgeStatusLabel(formatStableflowStatusLabel(status));
            },
          );
        }

        setStatusPhase("awaiting_funds");
        const balancePayload = await pollFunderCollateralBalances((balances) => {
          const mode = resolvePendingDepositConvertMode(balances);

          if (mode === "wrap-only") {
            setDetectedUsdceAmount(balances.usdce.balance);
            setDetectedUsdcAmount(undefined);
          } else if (mode === "full") {
            setDetectedUsdcAmount(balances.usdc.balance);
            setDetectedUsdceAmount(
              BigInt(balances.usdce.balanceBaseUnits || "0") > 0n
                ? balances.usdce.balance
                : undefined,
            );
          }
        });

        setFunderCollateralBalances(balancePayload);
        const readyMode = resolvePendingDepositConvertMode(balancePayload);

        if (readyMode === "wrap-only") {
          setDetectedUsdceAmount(balancePayload.usdce.balance);
          setDetectedUsdcAmount(undefined);
        } else if (readyMode === "full") {
          setDetectedUsdcAmount(balancePayload.usdc.balance);
          setDetectedUsdceAmount(
            BigInt(balancePayload.usdce.balanceBaseUnits || "0") > 0n
              ? balancePayload.usdce.balance
              : undefined,
          );
        }

        setStableflowExecution((current) =>
          current
            ? {
                ...current,
                expectedAmountBaseUnits: minBaseUnits(
                  current.expectedAmountBaseUnits,
                  readyMode === "wrap-only"
                    ? balancePayload.usdce.balanceBaseUnits
                    : balancePayload.usdc.balanceBaseUnits,
                ),
              }
            : current,
        );
        setStatusPhase("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setStatusPhase("error");
        setStatusError(error instanceof Error ? error.message : String(error));
      }
    },
    [pollFunderCollateralBalances, pollStableflowBridge],
  );

  const onConfirmTopup = async () => {
    if (
      !selectedToken ||
      !session?.walletAddress ||
      !session.funderAddress ||
      !polygonUsdcDestinationAssetId
    ) {
      toast.error("Private top up is not ready. Try again.");
      return;
    }

    setContinueLoading(true);
    setStatusError(undefined);
    setStep("status");
    setStatusPhase("bridging");

    try {
      if (selectedToken.chainType === FundingNetworkType.EVM) {
        await ensureFundingEvmChain(
          session.walletAddress,
          selectedToken.chainId,
        );
      }

      const execution = await depositViaStableflow(
        amount.tokenAmount,
        selectedToken,
        session.funderAddress,
        polygonUsdcDestinationAssetId,
      );

      setStableflowExecution(execution);
      void runStatusPolling(execution);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusPhase("error");
      setStatusError(message);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const onConfirmPendingConvert = async () => {
    if (
      !session?.walletAddress ||
      !stableflowExecution ||
      !funderCollateralBalances ||
      !pendingConvertMode
    ) {
      return;
    }

    setContinueLoading(true);
    setStatusPhase("converting");
    setConvertStatusLabel(undefined);

    try {
      const amountUsd = getPendingConvertAmountUsd(
        funderCollateralBalances,
        pendingConvertMode,
      );

      await executePendingDepositConvert({
        walletAddress: session.walletAddress,
        mode: pendingConvertMode,
        amountUsd,
        onStatus: setConvertStatusLabel,
      });

      setStatusPhase("success");

      try {
        await syncCash();
      } catch (syncError) {
        console.warn(
          "[private-topup-dialog] syncCash after convert failed",
          syncError,
        );
      }

      toast.success("Top up successful");
      handleClose();
      await onSuccess?.();
    } catch (error: unknown) {
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
          Continue
        </button>
      );
    }

    if (step === "amount" && selectedToken) {
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
          {continueLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Continue
        </button>
      );
    }

    if (step === "confirm") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={continueLoading || !stableflowQuote}
          onClick={() => void onConfirmTopup()}
        >
          {continueLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Confirm
        </button>
      );
    }

    return undefined;
  }, [
    amount.tokenAmount,
    continueLoading,
    onConfirmTopup,
    onContinueToConfirm,
    selectedToken,
    selectedTokenMaxAmount,
    stableflowQuote,
    step,
  ]);

  const shellMinHeight =
    step === "confirm" ? "min-h-[600px]" : step === "amount" ? "min-h-[480px]" : "min-h-[515px]";

  return (
    <Modal
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
          privateAccountAddress: session?.funderAddress,
          balancesLoading,
          pricesLoading,
        }}
      >
        <FundingModalShell
          title="Top up Private Balance"
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
            />
          ) : null}

          {step === "amount" && selectedToken ? (
            <PrivateTopupAmountStep
              key={`${selectedToken.chainId}-${selectedToken.address}`}
              token={selectedToken}
              amount={amount}
              maxAmount={selectedTokenMaxAmount}
              onAmountChange={setAmount}
            />
          ) : null}

          {step === "confirm" && selectedToken && session?.funderAddress ? (
            <PrivateTopupConfirmStep
              topupWalletAddress={topupWalletAddress}
              privateAccountAddress={session.funderAddress}
              token={selectedToken}
              tokenAmount={amount.tokenAmount}
              amountUsd={amount.amountUsd}
              stableflowQuote={stableflowQuote}
            />
          ) : null}

          {step === "status" && session?.funderAddress ? (
            <DepositStatusStep
              phase={statusPhase}
              funderAddress={session.funderAddress}
              pendingConvertMode={pendingConvertMode}
              detectedUsdcAmount={detectedUsdcAmount}
              detectedUsdceAmount={detectedUsdceAmount}
              bridgeStatusLabel={bridgeStatusLabel}
              convertStatusLabel={convertStatusLabel}
              error={statusError}
              convertLoading={continueLoading}
              onConfirmConvert={onConfirmPendingConvert}
            />
          ) : null}
        </FundingModalShell>
      </PrivateTopupProvider>
    </Modal>
  );
}

function minBaseUnits(expected: string, actual: string): string {
  try {
    const expectedValue = BigInt(expected || "0");
    const actualValue = BigInt(actual || "0");

    if (actualValue === 0n) {
      return expected;
    }

    return actualValue < expectedValue ? actual.toString() : expected;
  } catch {
    return expected;
  }
}
