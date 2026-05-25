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
  selectTokenPrice,
  selectTokenUsdValue
} from "@/lib/funding/price-selectors";
import {
  stableflowTokensToFundingTokens,
  type StableflowDepositToken
} from "@/lib/funding/stableflow";
import {
  executePendingDepositConvert,
  getPendingConvertAmountUsd,
  resolvePendingDepositConvertMode,
  type FunderCollateralBalances
} from "@/lib/trading/deposit-wallet-convert";
import { useDeposit, useEvmBalances, usePrices } from "@/hooks/funding";
import { useAuth } from "@/context/auth";
import { fetchJson } from "@/lib/team/client-fetch";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store";
import { DEPOSIT_MODAL_WIDTH } from "@/views/portfolio/deposit/config";
import {
  DepositAmountStep,
  isDepositAmountValid
} from "@/views/portfolio/deposit/deposit-amount-step";
import { DepositConfirmStep } from "@/views/portfolio/deposit/deposit-confirm-step";
import { DepositEntryStep } from "@/views/portfolio/deposit/deposit-entry-step";
import {
  DepositStatusStep,
  formatStableflowStatusLabel
} from "@/views/portfolio/deposit/deposit-status-step";
import { DepositTokenStep } from "@/views/portfolio/deposit/deposit-token-step";
import type {
  DepositMethod,
  DepositSelectableToken,
  DepositStatusPhase,
  DepositStep,
  StableflowDepositContext
} from "@/views/portfolio/deposit/types";
import { isStableflowDepositToken } from "@/views/portfolio/deposit/types";
import {
  FundingModalShell,
  fundingPrimaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { DepositProvider } from "./context";

export interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onDepositSuccess?: () => void | Promise<void>;
}

const INITIAL_STEP: DepositStep = "entry";

export function DepositDialog({
  open,
  onClose,
  onDepositSuccess
}: DepositDialogProps) {
  const { session, syncCash } = useAuth();

  const [step, setStep] = useState<DepositStep>(INITIAL_STEP);
  const [depositMethod, setDepositMethod] =
    useState<DepositMethod>("connected");
  const [selectedToken, setSelectedToken] = useState<
    DepositSelectableToken | undefined
  >();
  const [amount, setAmount] = useState("0");
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
    supportedAssets,
    depositViaPolygon,
    depositViaStableflow,
    pollStableflowBridge,
    pollFunderCollateralBalances,
    stopStatusPoll
  } = useDeposit();

  const pendingConvertMode = funderCollateralBalances
    ? resolvePendingDepositConvertMode(funderCollateralBalances)
    : null;

  const stableflowFundingTokens = useMemo(
    () => stableflowTokensToFundingTokens(stableflowTokens),
    [stableflowTokens]
  );

  const { loading: connectedBalancesLoading, getTokenBalance } = useEvmBalances(
    {
      auto: open,
      enabled: open && !!session && depositMethod === "connected"
    }
  );

  useEvmBalances({
    auto: true,
    enabled:
      open &&
      !!session &&
      depositMethod === "stableflow" &&
      stableflowFundingTokens.length > 0,
    tokens: stableflowFundingTokens,
    merge: true
  });

  const { loading: pricesLoading } = usePrices({
    auto: open,
    enabled: open
  });

  const evmBalances = useBalancesStore((state) => state.evmBalances);
  const balancesLoading =
    depositMethod === "stableflow"
      ? stableflowTokensLoading
      : connectedBalancesLoading;

  const selectableTokens =
    depositMethod === "stableflow" ? stableflowTokens : supportedAssets;

  const selectedTokenMaxAmount = useMemo(() => {
    if (!selectedToken) {
      return "0";
    }

    return selectFundingTokenBalanceString(evmBalances, selectedToken);
  }, [evmBalances, selectedToken]);

  const reset = useCallback(() => {
    setStep(INITIAL_STEP);
    setDepositMethod("connected");
    setSelectedToken(undefined);
    setAmount("0");
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

  const modalWidth =
    step === "entry" ? DEPOSIT_MODAL_WIDTH.entry : DEPOSIT_MODAL_WIDTH.step;

  const ariaLabel = useMemo(() => {
    switch (step) {
      case "entry":
        return "Deposit entry";
      case "tokens":
        return "Select deposit token";
      case "amount":
        return "Enter deposit amount";
      case "confirm":
        return "Confirm deposit";
      case "status":
        return "Deposit status";
      default:
        return "Deposit";
    }
  }, [step]);

  function handleBack() {
    if (step === "tokens") {
      setStep("entry");
      setSelectedToken(undefined);
      return;
    }

    if (step === "amount") {
      setStep("tokens");
      setAmount("0");
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

  const showBack = !["entry", "tokens"].includes(step);

  const onSelectStableflow = async () => {
    try {
      if (stableflowTokens.length === 0) {
        await loadStableflowTokens();
      }

      setDepositMethod("stableflow");
      setSelectedToken(undefined);
      setStep("tokens");
    } catch {
      // toast already shown
    }
  };

  const onContinueToAmount = async () => {
    if (!selectedToken) {
      return false;
    }

    setContinueLoading(true);

    try {
      const latestBalance = await getTokenBalance(selectedToken);
      const latestBalanceUsd = selectTokenUsdValue(
        prices,
        selectedToken.symbol,
        latestBalance
      );

      if (
        depositMethod === "connected" &&
        Big(latestBalanceUsd || 0).lt(selectedToken.minCheckoutUsd)
      ) {
        toast.error(
          `${selectedToken.symbol} minimum deposit amount is $${selectedToken.minCheckoutUsd} or higher`
        );
        return;
      }

      if (depositMethod === "connected") {
        const selectedTokenPrice = selectTokenPrice(
          prices,
          selectedToken.symbol
        );
        const minAmount = Big(selectedToken.minCheckoutUsd)
          .div(selectedTokenPrice || 1)
          .toFixed(4, Big.roundDown);
        setAmount(minAmount);
      } else if (Big(latestBalance || 0).gt(0)) {
        setAmount(latestBalance);
      }

      setStep("amount");
    } finally {
      setContinueLoading(false);
    }
  };

  const onContinueToConfirm = async () => {
    if (!selectedToken) {
      return false;
    }

    setContinueLoading(true);

    try {
      if (
        depositMethod === "stableflow" &&
        isStableflowDepositToken(selectedToken) &&
        session?.funderAddress
      ) {
        const amountBaseUnits = Big(amount)
          .times(10 ** selectedToken.decimals)
          .toFixed(0, 0);
        const { quote } = await fetchJson<{ quote: QuoteResponse }>(
          "/api/trading/stableflow/quote",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              originAssetId: selectedToken.assetId,
              destinationAssetId: polygonUsdcDestinationAssetId,
              amountBaseUnits,
              refundTo: session.walletAddress,
              recipient: session.funderAddress
            })
          }
        );
        setStableflowQuote(quote);
      }

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
            }
          );
        }

        setStatusPhase("awaiting_funds");
        const balancePayload = await pollFunderCollateralBalances(
          (balances) => {
            const mode = resolvePendingDepositConvertMode(balances);

            if (mode === "wrap-only") {
              setDetectedUsdceAmount(balances.usdce.balance);
              setDetectedUsdcAmount(undefined);
            } else if (mode === "full") {
              setDetectedUsdcAmount(balances.usdc.balance);
              setDetectedUsdceAmount(
                BigInt(balances.usdce.balanceBaseUnits || "0") > 0n
                  ? balances.usdce.balance
                  : undefined
              );
            }
          }
        );

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
              : undefined
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
                    : balancePayload.usdc.balanceBaseUnits
                )
              }
            : current
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
    [pollFunderCollateralBalances, pollStableflowBridge]
  );

  const onConfirmDeposit = async () => {
    if (!selectedToken || !session?.walletAddress) {
      return;
    }

    if (depositMethod === "connected") {
      setContinueLoading(true);

      try {
        if (selectedToken.chainType === FundingNetworkType.EVM) {
          await ensureFundingEvmChain(
            session.walletAddress,
            selectedToken.chainId
          );
        }

        await depositViaPolygon(amount, selectedToken);
        toast.success("Deposit successful");
        handleClose();
        syncCash();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(message);
      } finally {
        setContinueLoading(false);
      }

      return;
    }

    if (
      !isStableflowDepositToken(selectedToken) ||
      !session.funderAddress ||
      !polygonUsdcDestinationAssetId
    ) {
      toast.error("Stableflow deposit is not ready. Try again.");
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
          selectedToken.chainId
        );
      }

      const execution = await depositViaStableflow(
        amount,
        selectedToken,
        session.funderAddress,
        polygonUsdcDestinationAssetId
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
        pendingConvertMode
      );

      await executePendingDepositConvert({
        walletAddress: session.walletAddress,
        mode: pendingConvertMode,
        amountUsd,
        onStatus: setConvertStatusLabel
      });

      setStatusPhase("success");

      try {
        await syncCash();
      } catch (syncError) {
        console.warn(
          "[deposit-dialog] syncCash after convert failed",
          syncError
        );
      }

      toast.success("Deposit successful");
      syncCash();
      handleClose();
      if (onDepositSuccess) {
        await onDepositSuccess();
      } else {
        await syncCash();
      }
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
    if (step === "entry" || step === "status") {
      return undefined;
    }

    if (step === "tokens") {
      const canContinue = !!selectedToken;

      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!canContinue || continueLoading}
          onClick={() => void onContinueToAmount()}
        >
          {continueLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Continue
        </button>
      );
    }

    if (step === "amount" && selectedToken) {
      const canContinue = isDepositAmountValid(amount, selectedTokenMaxAmount);

      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!canContinue || continueLoading}
          onClick={() => void onContinueToConfirm()}
        >
          {continueLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Continue
        </button>
      );
    }

    if (step === "confirm") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={continueLoading}
          onClick={() => void onConfirmDeposit()}
        >
          {continueLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Confirm
        </button>
      );
    }

    return undefined;
  }, [
    amount,
    continueLoading,
    depositMethod,
    onConfirmDeposit,
    selectedToken,
    selectedTokenMaxAmount,
    step
  ]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      ariaLabel={ariaLabel}
      className={modalWidth}
      hideCloseButton
      overlayCloseable={false}
    >
      <DepositProvider
        value={{
          depositMethod,
          selectableTokens,
          funderAddress: session?.funderAddress,
          supportedAssets: selectableTokens,
          balancesLoading,
          pricesLoading
        }}
      >
        <FundingModalShell
          title="Deposit"
          onClose={handleClose}
          onBack={showBack ? handleBack : undefined}
          footer={footer}
          className={
            step === "entry"
              ? "min-h-[400px]"
              : step === "confirm"
                ? "min-h-[600px]"
                : "min-h-[515px]"
          }
        >
          {step === "entry" ? (
            <DepositEntryStep
              onSelectConnected={() => {
                setDepositMethod("connected");
                setStep("tokens");
              }}
              onSelectStableflow={() => void onSelectStableflow()}
              stableflowLoading={stableflowTokensLoading}
            />
          ) : null}

          {step === "tokens" ? (
            <DepositTokenStep
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
            />
          ) : null}

          {step === "amount" && selectedToken ? (
            <DepositAmountStep
              key={`${selectedToken.chainId}-${selectedToken.address}`}
              token={selectedToken}
              amount={amount}
              maxAmount={selectedTokenMaxAmount}
              onAmountChange={setAmount}
            />
          ) : null}

          {step === "confirm" && selectedToken ? (
            <DepositConfirmStep
              walletAddress={session?.walletAddress ?? ""}
              token={selectedToken}
              amount={amount}
              quoteMode={
                depositMethod === "stableflow" ? "stableflow" : "bridge"
              }
              stableflowQuote={stableflowQuote}
              recipientAddress={session?.funderAddress}
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
      </DepositProvider>
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
