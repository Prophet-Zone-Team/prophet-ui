"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { FundingAsset, FundingNetworkType } from "@/config/funding";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import { useDeposit, useEvmBalances, usePrices } from "@/hooks/funding";
import { DEPOSIT_MODAL_WIDTH } from "@/views/portfolio/deposit/config";
import { DepositAmountStep, isDepositAmountValid } from "@/views/portfolio/deposit/deposit-amount-step";
import { DepositConfirmStep } from "@/views/portfolio/deposit/deposit-confirm-step";
import { DepositEntryStep } from "@/views/portfolio/deposit/deposit-entry-step";
import { DepositTokenStep } from "@/views/portfolio/deposit/deposit-token-step";
import type { DepositStep } from "@/views/portfolio/deposit/types";
import {
  FundingModalShell,
  fundingPrimaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { DepositProvider } from "./context";
import { selectFundingTokenBalanceString } from "@/lib/funding/balance-selectors";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store";
import { selectTokenPrice, selectTokenUsdValue } from "@/lib/funding/price-selectors";
import Big from "big.js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";

export interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onDepositSuccess?: () => void | Promise<void>;
}

const INITIAL_STEP: DepositStep = "tokens";

export function DepositDialog({ open, onClose, onDepositSuccess }: DepositDialogProps) {
  const { session, syncCash } = useAuth();

  const [step, setStep] = useState<DepositStep>(INITIAL_STEP);
  const [selectedToken, setSelectedToken] = useState<FundingAsset | undefined>();
  const [amount, setAmount] = useState("0");
  const [continueLoading, setContinueLoading] = useState(false);

  const prices = usePricesStore((state) => state.prices);
  const {
    supportedAssets,
    depositViaPolygon,
  } = useDeposit();
  const { loading: balancesLoading, getTokenBalance } = useEvmBalances({
    auto: open,
    enabled: open && !!session,
  });
  const { loading: pricesLoading } = usePrices({
    auto: open,
    enabled: open,
  });
  const evmBalances = useBalancesStore((state) => state.evmBalances);

  const selectedTokenMaxAmount = useMemo(() => {
    if (!selectedToken) {
      return "0";
    }

    return selectFundingTokenBalanceString(evmBalances, selectedToken);
  }, [evmBalances, selectedToken]);

  const reset = useCallback(() => {
    setStep(INITIAL_STEP);
    setSelectedToken(undefined);
    setAmount("0");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

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
    }
  }

  const showBack = !["entry", "tokens"].includes(step);

  const onContinueToAmount = async () => {
    if (!selectedToken) {
      return false;
    }
    setContinueLoading(true);
    const latestBalance = await getTokenBalance(selectedToken);
    const latestBalanceUsd = selectTokenUsdValue(prices, selectedToken.symbol, latestBalance);
    if (Big(latestBalanceUsd || 0).lt(selectedToken.minCheckoutUsd)) {
      setContinueLoading(false);
      toast.error(`${selectedToken.symbol} minimum deposit amount is $${selectedToken.minCheckoutUsd} or higher`);
      return;
    }
    const selectedTokenPrice = selectTokenPrice(prices, selectedToken.symbol);
    const minAmount = Big(selectedToken.minCheckoutUsd).div(selectedTokenPrice || 1).toFixed(4, Big.roundDown);
    setAmount(minAmount);
    setStep("amount");
    setContinueLoading(false);
  };

  const onContinueToConfirm = async () => {
    if (!selectedToken) {
      return false;
    }
    setContinueLoading(true);
    // const amountUsd = selectTokenUsdValue(prices, selectedToken.symbol, amount);
    // if (Big(amountUsd || 0).lt(selectedToken.minCheckoutUsd)) {
    //   setContinueLoading(false);
    //   toast.error(`${selectedToken.symbol} minimum deposit amount is $${selectedToken.minCheckoutUsd} or higher`);
    //   return;
    // }
    setStep("confirm");
    setContinueLoading(false);
  };

  const onConfirmDeposit = async () => {
    if (!selectedToken || !session?.walletAddress) {
      return;
    }

    setContinueLoading(true);
    try {
      if (selectedToken.chainType === FundingNetworkType.EVM) {
        await ensureFundingEvmChain(session.walletAddress, selectedToken.chainId);
      }

      await depositViaPolygon(amount, selectedToken);

      toast.success("Deposit successful");
      handleClose();
      if (onDepositSuccess) {
        await onDepositSuccess();
      } else {
        await syncCash();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const footer = useMemo(() => {
    if (step === "entry") {
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
          onClick={onContinueToConfirm}
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
          onClick={onConfirmDeposit}
        >
          {continueLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Confirm
        </button>
      );
    }

    return undefined;
  }, [amount, getTokenBalance, handleClose, selectedToken, selectedTokenMaxAmount, step, continueLoading]);

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
          supportedAssets,
          balancesLoading,
          pricesLoading,
        }}
      >
        <FundingModalShell
          title="Deposit"
          onClose={handleClose}
          onBack={showBack ? handleBack : undefined}
          footer={footer}
          className={step === "entry" ? "min-h-[400px]" : step === "confirm" ? "min-h-[600px]" : "min-h-[515px]"}
        >
          {step === "entry" ? (
            <DepositEntryStep
              onSelectConnected={() => setStep("tokens")}
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
            />
          ) : null}
        </FundingModalShell>
      </DepositProvider>
    </Modal>
  );
}
