"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
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
import type { TradingUserSession } from "@/types/market";
import { DepositProvider } from "./context";
import { useDeposit } from "@/hooks/funding";
import { FundingAsset } from "@/config/funding";

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

  const { supportedAssets } = useDeposit();

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

  // When the Continue button is clicked
  // Get the token balance
  const onContinueToAmount = async () => {
    setAmount(0);
    setStep("amount");
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
          disabled={!canContinue}
          onClick={onContinueToAmount}
        >
          Continue
        </button>
      );
    }

    if (step === "amount" && selectedToken) {
      const canContinue = isDepositAmountValid(amount, 1000);

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
  }, [amount, handleClose, selectedToken, step]);

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
