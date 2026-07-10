"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { FundingAsset } from "@/config/funding";
import {
  COPY_TRADE_POLYMARKET_DEPOSIT_MIN_USD,
  useCopyTradePolymarketDeposit,
} from "@/hooks/copy-trade/use-copy-trade-polymarket-deposit";
import { useCopyTradeDeposit } from "@/hooks/copy-trade/use-copy-trade-deposit";
import { useCopyTradeTransferDepositStatus } from "@/hooks/copy-trade/use-copy-trade-transfer-deposit-status";
import { useFundingWalletConnect } from "@/hooks/funding/use-funding-wallet-connect";
import {
  resolveCopyDepositAddress,
  type CopyDepositChainOption,
} from "@/lib/copy-trade/deposit-assets";
import { requiresDepositFundingWalletConnection } from "@/lib/funding/stableflow";
import { isTpFundingSwitchPendingError } from "@/lib/wallet/tokenpocket/tp-funding-switch";
import { DEFAULT_DEPOSIT_ASSET, POLYGON_NETWORK } from "@/lib/market/deposit-assets";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber } from "@/utils";
import { DepositAssetStep } from "@/views/copy-trade/funding/deposit-asset-step";
import { DepositConnectedStep } from "@/views/copy-trade/funding/deposit-connected-step";
import { DepositQrStep } from "@/views/copy-trade/funding/deposit-address-step";
import {
  DepositMethodBackRow,
  DepositMethodEntry,
} from "@/views/copy-trade/funding/deposit-method-entry";
import { DepositPolymarketStep } from "@/views/copy-trade/funding/deposit-polymarket-step";
import { DepositStatusStep } from "@/views/copy-trade/funding/deposit-status-step";
import { DepositTransferStatusStep } from "@/views/copy-trade/funding/deposit-transfer-status-step";
import type { CopyDepositMethod, CopyDepositStep } from "@/views/copy-trade/funding/types";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import Big from "big.js";
import { Loader2 } from "lucide-react";

export interface CopyTradeDepositDialogProps {
  open: boolean;
  onClose: () => void;
}

function pickDefaultToken(tokens: FundingAsset[]): FundingAsset | undefined {
  return (
    tokens.find((token) => {
      if (token.chainId === 56) {
        return (
          token.symbol === DEFAULT_DEPOSIT_ASSET.symbol &&
          token.name === "USD Coin"
        );
      }
      return token.symbol === DEFAULT_DEPOSIT_ASSET.symbol;
    }) ?? tokens[0]
  );
}

export function CopyTradeDepositDialog({
  open,
  onClose,
}: CopyTradeDepositDialogProps) {
  const t = useTranslations("copyTrade.funding.deposit");
  const tPortfolio = useTranslations("portfolio");
  const tAuth = useTranslations("auth");
  const tWallet = useTranslations("wallet");
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const sessionWalletAddress = useAuthStore(
    (state) => state.session?.walletAddress,
  );

  const [step, setStep] = useState<CopyDepositStep>("asset");
  const [depositMethod, setDepositMethod] = useState<CopyDepositMethod>("connected");
  const [selectedChain, setSelectedChain] =
    useState<CopyDepositChainOption | null>(null);
  const [selectedToken, setSelectedToken] = useState<FundingAsset | null>(null);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();

  const handleCredited = useCallback(
    (credited: number) => {
      toast.success(
        t("depositCredited", { amount: formatNumber(credited, 2) }),
      );
    },
    [t],
  );

  const deposit = useCopyTradeDeposit({
    open,
    onCredited: handleCredited,
    aggressiveStatusPolling: step === "status",
  });

  const {
    connectForDepositToken,
    isConnectedForDepositToken,
    getDepositConnectLabelKey,
  } = useFundingWalletConnect();

  const polymarketDeposit = useCopyTradePolymarketDeposit({
    copyDepositWalletAddress: deposit.copyDepositWalletAddress,
    walletReady: deposit.walletReady,
    isSocialLogin: deposit.isSocialLogin,
  });

  const transferDepositStatus = useCopyTradeTransferDepositStatus({
    open: open && step === "status" && depositMethod === "polymarket",
    txHash,
    onCredited: handleCredited,
  });

  const tokensForChain = useMemo(
    () =>
      selectedChain ? deposit.getTokensForChain(selectedChain.chainId) : [],
    [deposit, selectedChain],
  );

  const qrDepositAddress = useMemo(() => {
    if (!selectedChain) {
      return "";
    }
    return resolveCopyDepositAddress(
      deposit.depositAddress,
      selectedChain.chainType,
    );
  }, [deposit.depositAddress, selectedChain]);

  const formatDepositConnectLabel = useCallback(
    (token: FundingAsset) => {
      const labelKey = getDepositConnectLabelKey(token);
      if (labelKey === "connectChainWallet") {
        return tWallet(labelKey, { chainName: token.chainName });
      }
      return tWallet(labelKey);
    },
    [getDepositConnectLabelKey, tWallet],
  );

  const handleFundingWalletConnect = useCallback(
    async (token: FundingAsset) => {
      setConnectingWallet(true);
      try {
        await connectForDepositToken(token, loginMethod);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isTpFundingSwitchPendingError(error)) {
          toast.message(message);
          return;
        }
        toast.error(message);
      } finally {
        setConnectingWallet(false);
      }
    },
    [connectForDepositToken, loginMethod],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep(deposit.isSocialLogin ? "qr" : "asset");
    setDepositMethod("connected");
    setAmount("");
    setTxHash("");
    setErrorText(undefined);
  }, [deposit.isSocialLogin, open]);

  useEffect(() => {
    if (!selectedChain && deposit.chainOptions.length > 0) {
      const defaultSelectedChain =
        deposit.chainOptions.find(
          (chain) => chain.chainId === POLYGON_NETWORK.chainId,
        ) ?? deposit.chainOptions[0];
      setSelectedChain(defaultSelectedChain);
    }
  }, [deposit.chainOptions, selectedChain]);

  useEffect(() => {
    if (!selectedChain) {
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
      const defaultSelectedToken = pickDefaultToken(tokensForChain);
      setSelectedToken(defaultSelectedToken ?? null);
    }
  }, [selectedChain, selectedToken, tokensForChain]);

  const validateConnectedAmount = (): string | undefined => {
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

  const validatePolymarketAmount = (): string | undefined => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return t("validAmount");
    }
    if (value < COPY_TRADE_POLYMARKET_DEPOSIT_MIN_USD) {
      return t("minimumDeposit", {
        amount: formatNumber(COPY_TRADE_POLYMARKET_DEPOSIT_MIN_USD, 2, true, {
          prefix: "$",
        }),
      });
    }
    if (value > polymarketDeposit.polymarketBalance) {
      return t("amountExceedsPolymarketBalance");
    }
    if (!deposit.copyDepositWalletAddress) {
      return t("polymarketDepositWalletNotReady");
    }
    return undefined;
  };

  const handleContinue = () => {
    const validationError = validateConnectedAmount();
    if (validationError) {
      setErrorText(validationError);
      return;
    }
    setErrorText(undefined);
    setStep("confirm");
  };

  const handleContinueFromQr = () => {
    setStep("status");
    void deposit.refreshStatus();
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

  const handlePolymarketTransfer = async () => {
    const validationError = validatePolymarketAmount();
    if (validationError) {
      setErrorText(validationError);
      return;
    }

    setSubmitting(true);
    setErrorText(undefined);
    try {
      const hash = await polymarketDeposit.transferFromPolymarket(amount);
      setTxHash(hash ?? "");
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
      if (step === "qr") {
        return (
          <DepositQrStep
            chainOptions={deposit.chainOptions}
            tokensForChain={tokensForChain}
            selectedChain={selectedChain}
            selectedToken={selectedToken}
            depositAddress={qrDepositAddress}
            loading={deposit.addressLoading}
            assetsLoading={deposit.assetsLoading}
            onChainChange={(chain) => {
              setSelectedChain(chain);
            }}
            onTokenChange={setSelectedToken}
          />
        );
      }

      return (
        <DepositStatusStep
          txHash=""
          status={deposit.status}
          mode="qr"
        />
      );
    }

    if (step === "asset" && depositMethod === "polymarket" && polymarketDeposit.funderAddress) {
      return (
        <div className="flex flex-col gap-4">
          <DepositMethodBackRow
            funderAddress={polymarketDeposit.funderAddress}
            onBack={() => {
              setDepositMethod("connected");
              setAmount("");
              setErrorText(undefined);
            }}
          />
          <DepositPolymarketStep
            funderAddress={polymarketDeposit.funderAddress}
            balanceUsd={polymarketDeposit.polymarketBalance}
            amount={amount}
            onAmountChange={(next) => {
              setAmount(next);
              setErrorText(undefined);
            }}
            errorText={errorText}
          />
        </div>
      );
    }

    if (step === "asset") {
      return (
        <div className="flex flex-col gap-4">
          {polymarketDeposit.canUsePolymarketDeposit &&
          polymarketDeposit.funderAddress ? (
            <DepositMethodEntry
              funderAddress={polymarketDeposit.funderAddress}
              balanceUsd={polymarketDeposit.polymarketBalance}
              onSelectPolymarket={() => {
                setDepositMethod("polymarket");
                setAmount("");
                setErrorText(undefined);
              }}
            />
          ) : null}
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
        </div>
      );
    }

    if (step === "confirm" && selectedToken) {
      return (
        <DepositConnectedStep
          token={selectedToken}
          amount={amount}
          toAddress={deposit.resolveDepositAddressForToken(selectedToken)}
          errorText={errorText}
        />
      );
    }

    if (step === "status" && depositMethod === "polymarket") {
      return (
        <DepositTransferStatusStep
          txHash={txHash}
          record={transferDepositStatus.record}
          loading={transferDepositStatus.loading}
          errorText={transferDepositStatus.errorText}
        />
      );
    }

    return (
      <DepositStatusStep
        txHash={txHash}
        status={deposit.status}
        mode="wallet"
      />
    );
  };

  const renderFooter = () => {
    if (!deposit.walletReady) {
      return undefined;
    }

    if (deposit.isSocialLogin) {
      if (step === "qr") {
        const canContinue =
          Boolean(qrDepositAddress) && !deposit.addressLoading;

        return (
          <button
            type="button"
            className={fundingPrimaryButtonClass}
            disabled={!canContinue}
            onClick={handleContinueFromQr}
          >
            {t("iHaveTransferred")}
          </button>
        );
      }

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

      return undefined;
    }

    if (step === "asset" && depositMethod === "polymarket") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!amount || Big(amount).lte(0) || submitting}
          onClick={() => void handlePolymarketTransfer()}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          <div>{submitting ? t("confirmInWallet") : t("transfer")}</div>
        </button>
      );
    }

    if (step === "asset") {
      if (selectedToken) {
        const needsFundingWallet = requiresDepositFundingWalletConnection(
          selectedToken,
          loginMethod,
        );
        const walletConnected = isConnectedForDepositToken(
          selectedToken,
          loginMethod,
          sessionWalletAddress,
        );

        if (needsFundingWallet && !walletConnected) {
          return (
            <button
              type="button"
              className={fundingPrimaryButtonClass}
              disabled={connectingWallet}
              onClick={() => void handleFundingWalletConnect(selectedToken)}
            >
              {connectingWallet ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {formatDepositConnectLabel(selectedToken)}
            </button>
          );
        }
      }

      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={
            !selectedToken ||
            !amount ||
            Big(amount).lte(0) ||
            deposit.balancesLoading
          }
          onClick={handleContinue}
        >
          {deposit.balancesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
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

    return undefined;
  };

  const onBack = deposit.isSocialLogin
    ? step === "status"
      ? () => setStep("qr")
      : undefined
    : step === "confirm"
      ? () => {
          setErrorText(undefined);
          setStep("asset");
        }
      : step === "asset" && depositMethod === "polymarket"
        ? () => {
            setDepositMethod("connected");
            setAmount("");
            setErrorText(undefined);
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
