"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { CopyWithdrawal, CopyWithdrawalAssetInfo } from "@/types/copy-trade-funding";
import {
  CopyWithdrawSubmitError,
  useCopyTradeWithdraw,
} from "@/hooks/copy-trade/use-copy-trade-withdraw";
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
  const t = useTranslations("copyTrade.funding.withdraw");
  const tPortfolio = useTranslations("portfolio");
  const tAuth = useTranslations("auth");
  const withdraw = useCopyTradeWithdraw(open);

  const [step, setStep] = useState<CopyWithdrawStep>("form");
  const [selectedAsset, setSelectedAsset] =
    useState<CopyWithdrawalAssetInfo | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [errorText, setErrorText] = useState<string | undefined>();
  const [result, setResult] = useState<CopyWithdrawal | null>(null);

  const blockReason = useMemo(
    () =>
      withdraw.blockReasonCode
        ? t(`blockReason.${withdraw.blockReasonCode}`)
        : "",
    [t, withdraw.blockReasonCode]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep("form");
    setAmount("");
    setErrorText(undefined);
    setResult(null);
  }, [open]);

  useEffect(() => {
    if (open && !recipient && withdraw.defaultRecipient) {
      setRecipient(withdraw.defaultRecipient);
    }
  }, [open, withdraw.defaultRecipient, recipient]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!selectedAsset) {
      setSelectedAsset(withdraw.availableAssets[0] ?? null);
    }
  }, [open, selectedAsset, withdraw.availableAssets]);

  const recipientError = useMemo(() => {
    if (!recipient) {
      return undefined;
    }
    return withdraw.isValidRecipient(recipient)
      ? undefined
      : t("invalidRecipient");
  }, [recipient, t, withdraw]);

  const submitDisabled =
    withdraw.submitting ||
    Boolean(withdraw.blockReasonCode) ||
    !selectedAsset ||
    withdraw.maxAmount <= 0 ||
    amount === "" ||
    Boolean(recipientError) ||
    !recipient;

  const resolveSubmitError = (error: unknown): string => {
    if (error instanceof CopyWithdrawSubmitError) {
      return t(`errors.${error.code}`);
    }
    return error instanceof Error ? error.message : String(error);
  };

  const handleSubmit = async () => {
    if (!selectedAsset) {
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setErrorText(t("validAmount"));
      return;
    }
    if (value > withdraw.maxAmount) {
      setErrorText(t("amountExceedsAvailable"));
      return;
    }
    if (
      selectedAsset.min_amount_pusd &&
      value < selectedAsset.min_amount_pusd
    ) {
      setErrorText(t("amountBelowMinimum"));
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
      toast.success(t("withdrawalSubmittedToast"));
    } catch (error) {
      setErrorText(resolveSubmitError(error));
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
          {tAuth("done")}
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
        {withdraw.submitting
          ? t("signInWallet")
          : tPortfolio("withdrawLabel")}
      </button>
    );
  };

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("ariaWithdraw")}
      overlayCloseable={false}
    >
      <FundingModalShell
        title={tPortfolio("withdrawLabel")}
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
            blockReason={blockReason}
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
