"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { FundingAsset } from "@/config/funding";
import { useCopyTradeDeposit } from "@/hooks/copy-trade/use-copy-trade-deposit";
import type { CopyDepositChainOption } from "@/lib/copy-trade/deposit-assets";
import { formatNumber } from "@/utils";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { DepositAddressStep } from "@/views/copy-trade/funding/deposit-address-step";
import { DepositAssetStep } from "@/views/copy-trade/funding/deposit-asset-step";
import { DepositConnectedStep } from "@/views/copy-trade/funding/deposit-connected-step";
import { DepositStatusStep } from "@/views/copy-trade/funding/deposit-status-step";
import type { CopyDepositStep } from "@/views/copy-trade/funding/types";
import { DEFAULT_DEPOSIT_ASSET, POLYGON_NETWORK } from "@/lib/market/deposit-assets";
import Big from "big.js";

export interface CopyTradeDepositDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CopyTradeDepositDialog({
  open,
  onClose,
}: CopyTradeDepositDialogProps) {
  const t = useTranslations("copyTrade.funding.deposit");
  const tPortfolio = useTranslations("portfolio");
  const tAuth = useTranslations("auth");

  const handleCredited = useCallback(
    (credited: number) => {
      toast.success(
        t("depositCredited", { amount: formatNumber(credited, 2) })
      );
    },
    [t]
  );

  const deposit = useCopyTradeDeposit({
    open,
    onCredited: handleCredited,
  });

  const [step, setStep] = useState<CopyDepositStep>("asset");
  const [selectedChain, setSelectedChain] =
    useState<CopyDepositChainOption | null>(null);
  const [selectedToken, setSelectedToken] = useState<FundingAsset | null>(null);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();

  const tokensForChain = useMemo(
    () =>
      selectedChain ? deposit.getTokensForChain(selectedChain.chainId) : [],
    [deposit, selectedChain],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep("asset");
    setAmount("");
    setTxHash("");
    setErrorText(undefined);
  }, [open]);

  useEffect(() => {
    if (deposit.isSocialLogin) {
      return;
    }
    if (!selectedChain && deposit.chainOptions.length > 0) {
      const defaultSelectedChain = deposit.chainOptions.find((chain) => chain.chainId === POLYGON_NETWORK.chainId) ?? deposit.chainOptions[0];
      setSelectedChain(defaultSelectedChain);
    }
  }, [deposit.chainOptions, deposit.isSocialLogin, selectedChain]);

  useEffect(() => {
    if (deposit.isSocialLogin || !selectedChain) {
      return;
    }
    const exists =
      selectedToken &&
      tokensForChain.some(
        (token) =>
          token.address === selectedToken.address &&
          token.chainId === selectedToken.chainId,
      );
    if (!exists) {
      const defaultSelectedToken = tokensForChain.find((token) => {
        if (token.chainId === 56) {
          return token.symbol === DEFAULT_DEPOSIT_ASSET.symbol && token.name === "USD Coin";
        }
        return token.symbol === DEFAULT_DEPOSIT_ASSET.symbol;
      }) ?? tokensForChain[0];
      setSelectedToken(defaultSelectedToken);
    }
  }, [deposit.isSocialLogin, selectedChain, selectedToken, tokensForChain]);

  const validateAmount = (): string | undefined => {
    if (!selectedToken) {
      return t("selectTokenToDeposit");
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return t("validAmount");
    }
    const balance = Number(deposit.resolveTokenBalance(selectedToken));
    if (value > balance) {
      return t("amountExceedsWalletBalance");
    }
    if (value < selectedToken.minCheckoutUsd) {
      return t("minimumDeposit", {
        amount: formatNumber(selectedToken.minCheckoutUsd, 2, true, {
          prefix: "$",
        }),
      });
    }
    return undefined;
  };

  const handleContinue = () => {
    const validationError = validateAmount();
    if (validationError) {
      setErrorText(validationError);
      return;
    }
    setErrorText(undefined);
    setStep("confirm");
  };

  const handleConfirmTransfer = async () => {
    if (!selectedToken) {
      return;
    }
    setSubmitting(true);
    setErrorText(undefined);
    try {
      const hash = await deposit.transferDeposit(amount, selectedToken);
      setTxHash(hash);
      setStep("status");
      toast.success(t("transferSubmitted"));
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const renderBody = () => {
    if (!deposit.walletReady) {
      return (
        <p className="py-8 text-center text-sm text-prophet-muted">
          {t("walletNotReady")}
        </p>
      );
    }

    if (deposit.isSocialLogin) {
      return (
        <DepositAddressStep
          address={deposit.evmDepositAddress}
          loading={deposit.addressLoading}
          status={deposit.status}
        />
      );
    }

    if (step === "asset") {
      return (
        <DepositAssetStep
          totalBalanceUsd={deposit.totalBalanceUsd}
          chainOptions={deposit.chainOptions}
          tokensForChain={tokensForChain}
          selectedChain={selectedChain}
          selectedToken={selectedToken}
          amount={amount}
          balancesLoading={deposit.balancesLoading}
          assetsLoading={deposit.assetsLoading}
          resolveTokenBalance={deposit.resolveTokenBalance}
          onChainChange={(chain) => {
            setSelectedChain(chain);
            setErrorText(undefined);
          }}
          onTokenChange={(token) => {
            setSelectedToken(token);
            setErrorText(undefined);
          }}
          onAmountChange={(next) => {
            setAmount(next);
            setErrorText(undefined);
          }}
          errorText={errorText}
        />
      );
    }

    if (step === "confirm" && selectedToken) {
      return (
        <DepositConnectedStep
          token={selectedToken}
          amount={amount}
          toAddress={deposit.evmDepositAddress}
          errorText={errorText}
        />
      );
    }

    return <DepositStatusStep txHash={txHash} status={deposit.status} />;
  };

  const renderFooter = () => {
    if (!deposit.walletReady || deposit.isSocialLogin) {
      return undefined;
    }

    if (step === "asset") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!selectedToken || !amount || Big(amount).lte(0) || deposit.balancesLoading}
          onClick={handleContinue}
        >
          {tAuth("continue")}
        </button>
      );
    }

    if (step === "confirm") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={submitting}
          onClick={() => void handleConfirmTransfer()}
        >
          {submitting ? t("confirmInWallet") : t("confirmDeposit")}
        </button>
      );
    }

    return (
      <button
        type="button"
        className={fundingPrimaryButtonClass}
        onClick={onClose}
      >
        {tAuth("done")}
      </button>
    );
  };

  const onBack =
    !deposit.isSocialLogin && step === "confirm"
      ? () => {
        setErrorText(undefined);
        setStep("asset");
      }
      : undefined;

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("ariaDeposit")}
      overlayCloseable={false}
    >
      <FundingModalShell
        title={tPortfolio("depositLabel")}
        onClose={onClose}
        onBack={onBack}
        footer={renderFooter()}
        className="w-full md:w-[500px] min-h-[500px]"
      >
        {renderBody()}
      </FundingModalShell>
    </FundingResponsiveOverlay>
  );
}
