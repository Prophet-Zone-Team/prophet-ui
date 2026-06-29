"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { CopyWithdrawal, CopyWithdrawalAssetInfo } from "@/types/copy-trade-funding";
import { useCopyTradeWithdraw } from "@/hooks/copy-trade/use-copy-trade-withdraw";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { WithdrawFormStep } from "@/views/copy-trade/funding/withdraw-form-step";
import { WithdrawStatusStep } from "@/views/copy-trade/funding/withdraw-status-step";
import type { CopyWithdrawStep } from "@/views/copy-trade/funding/types";

export interface CopyTradeWithdrawDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CopyTradeWithdrawDialog({
  open,
  onClose,
}: CopyTradeWithdrawDialogProps) {
  const withdraw = useCopyTradeWithdraw(open);

  const [step, setStep] = useState<CopyWithdrawStep>("form");
  const [selectedAsset, setSelectedAsset] =
    useState<CopyWithdrawalAssetInfo | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [errorText, setErrorText] = useState<string | undefined>();
  const [result, setResult] = useState<CopyWithdrawal | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep("form");
    setAmount("");
    setErrorText(undefined);
    setResult(null);
  }, [open]);

  // Default recipient to the linked web wallet once available.
  useEffect(() => {
    if (open && !recipient && withdraw.defaultRecipient) {
      setRecipient(withdraw.defaultRecipient);
    }
  }, [open, withdraw.defaultRecipient]);

  // Default to the first available asset.
  useEffect(() => {
    if (!open) {
      return;
    }
    if (!selectedAsset) {
      setSelectedAsset(withdraw.availableAssets[0] ?? null);
    }
  }, [open, withdraw.availableAssets]);

  const recipientError = useMemo(() => {
    if (!recipient) {
      return undefined;
    }
    return withdraw.isValidRecipient(recipient)
      ? undefined
      : "Enter a valid 0x recipient address.";
  }, [recipient, withdraw]);

  const submitDisabled =
    withdraw.submitting ||
    Boolean(withdraw.blockReason) ||
    !selectedAsset ||
    withdraw.maxAmount <= 0 ||
    amount === "" ||
    Boolean(recipientError) ||
    !recipient;

  const handleSubmit = async () => {
    if (!selectedAsset) {
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setErrorText("Enter a valid amount.");
      return;
    }
    if (value > withdraw.maxAmount) {
      setErrorText("Amount exceeds your available balance.");
      return;
    }
    if (
      selectedAsset.min_amount_pusd &&
      value < selectedAsset.min_amount_pusd
    ) {
      setErrorText("Amount is below the minimum withdrawal.");
      return;
    }

    setErrorText(undefined);
    try {
      const withdrawal = await withdraw.submitWithdraw({
        amount,
        recipient,
        asset: selectedAsset.asset,
      });
      setResult(withdrawal);
      setStep("status");
      toast.success("Withdrawal submitted");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : String(error));
    }
  };

  const renderFooter = () => {
    if (step === "status") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          onClick={onClose}
        >
          Done
        </button>
      );
    }

    return (
      <button
        type="button"
        className={fundingPrimaryButtonClass}
        disabled={submitDisabled}
        onClick={() => void handleSubmit()}
      >
        {withdraw.submitting ? "Sign in wallet…" : "Withdraw"}
      </button>
    );
  };

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel="Copy trade withdraw"
      overlayCloseable={false}
    >
      <FundingModalShell
        title="Withdraw"
        onClose={onClose}
        footer={renderFooter()}
        className="w-full md:w-[500px] min-h-[500px]"
      >
        {step === "status" && result ? (
          <WithdrawStatusStep withdrawal={result} />
        ) : (
          <WithdrawFormStep
            loading={withdraw.loading}
            allAssets={withdraw.allAssets}
            selectedAsset={selectedAsset}
            recipient={recipient}
            amount={amount}
            maxAmount={withdraw.maxAmount}
            blockReason={withdraw.blockReason}
            recipientError={recipientError}
            errorText={errorText}
            onAssetChange={(asset) => {
              setSelectedAsset(asset);
              setErrorText(undefined);
            }}
            onRecipientChange={(next) => setRecipient(next)}
            onAmountChange={(next) => {
              setAmount(next);
              setErrorText(undefined);
            }}
          />
        )}
      </FundingModalShell>
    </FundingResponsiveOverlay>
  );
}
