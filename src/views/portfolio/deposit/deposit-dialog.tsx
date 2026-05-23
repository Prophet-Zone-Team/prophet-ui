"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { FundingAsset } from "@/config/funding";
import { useDeposit, useEvmBalances, usePrices } from "@/hooks/funding";
import type { TradingUserSession } from "@/types/market";
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
import { selectFundingTokenBalanceNumber } from "@/lib/funding/balance-selectors";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store";
import { selectTokenUsdValue } from "@/lib/funding/price-selectors";
import Big from "big.js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  session: TradingUserSession;
}

const INITIAL_STEP: DepositStep = "tokens";

export function DepositDialog({ open, onClose, session }: DepositDialogProps) {
  const [step, setStep] = useState<DepositStep>(INITIAL_STEP);
  const [selectedToken, setSelectedToken] = useState<FundingAsset | undefined>();
  const [amount, setAmount] = useState(0);
  const [continueToAmountLoading, setContinueToAmountLoading] = useState(false);

  const prices = usePricesStore((state) => state.prices);
  const { supportedAssets } = useDeposit();
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
      return 0;
    }

    return selectFundingTokenBalanceNumber(evmBalances, selectedToken);
  }, [evmBalances, selectedToken]);

  const reset = useCallback(() => {
    setStep(INITIAL_STEP);
    setSelectedToken(undefined);
    setAmount(0);
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
      setAmount(0);
      return;
    }

    if (step === "confirm") {
      setStep("amount");
    }
  }

  const showBack = !["entry", "tokens"].includes(step);

  const onContinueToAmount = async () => {
    setContinueToAmountLoading(true);
    if (selectedToken) {
      const latestBalance = await getTokenBalance(selectedToken);
      const latestBalanceUsd = selectTokenUsdValue(prices, selectedToken.symbol, latestBalance);
      console.log("latestBalance: %o", latestBalance);
      console.log("latestBalanceUsd: %o", latestBalanceUsd);
      console.log("selectedToken: %o", selectedToken);
      if (Big(latestBalanceUsd || 0).lt(selectedToken.minCheckoutUsd)) {
        setContinueToAmountLoading(false);
        toast.error(`${selectedToken.symbol} minimum deposit amount is $${selectedToken.minCheckoutUsd} or higher`);
        return;
      }
    }
    setAmount(0);
    setStep("amount");
    setContinueToAmountLoading(false);
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
          disabled={!canContinue || continueToAmountLoading}
          onClick={() => void onContinueToAmount()}
        >
          {continueToAmountLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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
          disabled={!canContinue}
          onClick={() => setStep("confirm")}
        >
          Continue
        </button>
      );
    }

    if (step === "confirm") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          onClick={handleClose}
        >
          Confirm
        </button>
      );
    }

    return undefined;
  }, [amount, getTokenBalance, handleClose, selectedToken, selectedTokenMaxAmount, step, continueToAmountLoading]);

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
              walletAddress={session.walletAddress}
              token={selectedToken}
              amount={amount}
            />
          ) : null}
        </FundingModalShell>
      </DepositProvider>
    </Modal>
  );
}
