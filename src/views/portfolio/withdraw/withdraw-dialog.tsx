"use client";

import type { QuoteResponse } from "@stableflow/core";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Big from "big.js";

import type { FundingAsset } from "@/config/funding";
import { POLYMARKET_USD } from "@/config/funding";
import { getEvmFundingNetworks } from "@/config/funding/networks";
import { useBridgeQuote, useSupportedAssets, useWithdraw } from "@/hooks/funding";
import {
  buildWithdrawQuoteRequest,
  formatQuoteTokenAmount,
  mapQuoteToBreakdown,
  mapStableflowQuoteToBreakdown,
} from "@/lib/funding/bridge-quote";
import { mapStableflowQuoteToConfirmDisplay } from "@/lib/funding/stableflow";
import type { StableflowWithdrawToken } from "@/lib/funding/stableflow-withdraw";
import {
  getDefaultTokenForChain,
  getTokensForChain,
  getUniqueChainsFromAssets,
  type SupportedChainOption,
} from "@/lib/funding/supported-assets";
import { cn } from "@/lib/cn";
import { reportFundingTransaction } from "@/lib/portfolio/user";
import { fetchJson } from "@/lib/team/client-fetch";
import { formatShortWallet } from "@/lib/team/detail-format";
import { ensureTradingChain } from "@/lib/trading/wallet-trading-chain";
import { TransactionBreakdown } from "@/views/portfolio/deposit/transaction-breakdown";
import {
  depositTokenRowClass,
  depositTokenRowSelectedClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { getEffectiveMinDepositUsd } from "@/views/portfolio/deposit/utils";
import {
  WITHDRAW_MODAL_WIDTH,
  WITHDRAW_SOURCE_TOKEN_LABEL,
} from "@/views/portfolio/withdraw/config";
import { WithdrawEntryStep } from "@/views/portfolio/withdraw/withdraw-entry-step";
import { WithdrawStatusStep } from "@/views/portfolio/withdraw/withdraw-status-step";
import {
  isStableflowWithdrawSelectableToken,
  type WithdrawMethod,
  type WithdrawSelectableToken,
  type WithdrawStep,
} from "@/views/portfolio/withdraw/types";
import { parseWithdrawAmount, validateWithdrawAmount } from "@/views/portfolio/withdraw/utils";
import {
  withdrawAmountInputClass,
  withdrawFieldLabelClass,
  withdrawInputBoxClass,
  withdrawMaxButtonClass,
} from "@/views/portfolio/withdraw/withdraw-ui";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { FundingSelectorDropdown } from "@/views/portfolio/shared/funding-selector-dropdown";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { formatNumber, removeNumberEndZero } from "@/utils";
import { usePortfolioContext } from "../context";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const INITIAL_STEP: WithdrawStep = "entry";

export interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawDialog({ open, onClose }: WithdrawDialogProps) {
  const t = useTranslations("portfolio");
  const tWithdraw = useTranslations("portfolio.withdraw");
  const tCommon = useTranslations("common");
  const { session, portfolio, reload } = usePortfolioContext();
  const { supportedAssets, loading: assetsLoading } = useSupportedAssets({ enabled: open });
  const {
    status,
    error: withdrawError,
    operationPhase,
    operationDetail,
    executeBridgeWithdraw,
    executeStableflowWithdraw,
    fetchStableflowWithdrawQuote,
    stopStatusPoll,
  } = useWithdraw();

  const [step, setStep] = useState<WithdrawStep>(INITIAL_STEP);
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>("bridge");
  const [amountInput, setAmountInput] = useState("");
  const [selectedChain, setSelectedChain] = useState<SupportedChainOption | undefined>();
  const [selectedToken, setSelectedToken] = useState<WithdrawSelectableToken | undefined>();
  const [recipientInput, setRecipientInput] = useState("");
  const [stableflowTokens, setStableflowTokens] = useState<StableflowWithdrawToken[]>([]);
  const [stableflowTokensLoading, setStableflowTokensLoading] = useState(false);
  const [stableflowQuote, setStableflowQuote] = useState<QuoteResponse | undefined>();
  const [stableflowQuoteLoading, setStableflowQuoteLoading] = useState(false);
  const [stableflowQuoteError, setStableflowQuoteError] = useState<string | undefined>();
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isBridge = withdrawMethod === "bridge";

  const bridgeChainOptions = useMemo(
    () => getUniqueChainsFromAssets(supportedAssets),
    [supportedAssets],
  );

  const stableflowChainOptions = useMemo(
    () =>
      getEvmFundingNetworks().map((network) => ({
        chainId: network.chainId,
        chainName: network.chainName,
        chainIcon: network.chainIcon,
      })),
    [],
  );

  const chainOptions = isBridge ? bridgeChainOptions : stableflowChainOptions;

  const tokensForChain = useMemo(() => {
    if (!selectedChain) {
      return [];
    }

    if (isBridge) {
      return getTokensForChain(supportedAssets, selectedChain.chainId);
    }

    return stableflowTokens.filter((token) => token.chainId === selectedChain.chainId);
  }, [isBridge, selectedChain, stableflowTokens, supportedAssets]);

  const assetsLoadingForMethod = isBridge ? assetsLoading : stableflowTokensLoading;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (session?.walletAddress && !recipientInput) {
      setRecipientInput(session.walletAddress);
    }
  }, [open, session?.walletAddress]);

  useEffect(() => {
    if (!open || chainOptions.length === 0) {
      return;
    }

    setSelectedChain((current) => {
      if (current && chainOptions.some((chain) => chain.chainId === current.chainId)) {
        return current;
      }

      const defaultChain = chainOptions.find((chain) => chain.chainId === 137);
      return defaultChain ?? chainOptions[0];
    });
  }, [open, chainOptions]);

  useEffect(() => {
    if (!selectedChain) {
      setSelectedToken(undefined);
      return;
    }

    if (isBridge) {
      if (supportedAssets.length === 0) {
        setSelectedToken(undefined);
        return;
      }

      setSelectedToken((current) => {
        if (current && !("assetId" in current) && current.chainId === selectedChain.chainId) {
          return current;
        }

        return getDefaultTokenForChain(supportedAssets, selectedChain.chainId);
      });

      return;
    }

    setSelectedToken((current) => {
      if (current && "assetId" in current && current.chainId === selectedChain.chainId) {
        return current;
      }

      if (selectedChain?.chainId) {
        const selectedChainTokens = stableflowTokens.filter((token) => token.chainId === selectedChain.chainId);
        const defaultToken = selectedChainTokens.find((token) => token.symbol === "USDC") ?? selectedChainTokens[0];
        if (defaultToken) {
          return defaultToken;
        }
      }

      return stableflowTokens.find((token) => token.symbol === "USDC");
    });
  }, [isBridge, selectedChain, stableflowTokens, supportedAssets]);

  const amount = parseWithdrawAmount(amountInput);
  const maxAmount = portfolio?.availableToTrade ?? 0;
  const effectiveMinUsd =
    isBridge && selectedToken && !("assetId" in selectedToken)
      ? getEffectiveMinDepositUsd(selectedToken.minCheckoutUsd)
      : 0;
  const validationErrorKey = validateWithdrawAmount(amount, maxAmount, {
    minWithdrawUsd: effectiveMinUsd,
  });
  const validationError = validationErrorKey
    ? validationErrorKey === "amountBelowMinimum"
      ? tWithdraw("amountBelowMinimum", { amount: `${effectiveMinUsd}` })
      : tWithdraw(validationErrorKey)
    : undefined;
  const recipientError =
    recipientInput.trim() && !EVM_ADDRESS_PATTERN.test(recipientInput.trim())
      ? tWithdraw("invalidRecipient")
      : undefined;
  const formError = validationError ?? recipientError;

  const quoteEnabled =
    open &&
    step === "form" &&
    !!session?.walletAddress &&
    !!selectedToken &&
    amount !== undefined &&
    amount > 0 &&
    formError === undefined &&
    EVM_ADDRESS_PATTERN.test(recipientInput.trim());

  const bridgeQuoteRequest = useMemo(
    () =>
      isBridge && selectedToken && !("assetId" in selectedToken) && recipientInput.trim()
        ? buildWithdrawQuoteRequest({
          token: selectedToken,
          amount: amountInput,
          recipientAddress: recipientInput.trim(),
        })
        : undefined,
    [amountInput, isBridge, selectedToken, recipientInput],
  );

  const { quote: bridgeQuote, loading: bridgeQuoteLoading, error: bridgeQuoteError } = useBridgeQuote({
    request: bridgeQuoteRequest,
    enabled: quoteEnabled && isBridge,
  });

  useEffect(() => {
    if (!quoteEnabled || isBridge || !isStableflowWithdrawSelectableToken(selectedToken)) {
      setStableflowQuote(undefined);
      setStableflowQuoteError(undefined);
      return;
    }

    let cancelled = false;
    setStableflowQuoteLoading(true);
    setStableflowQuoteError(undefined);

    void fetchStableflowWithdrawQuote({
      amountUsd: amount!,
      destinationToken: selectedToken,
      recipient: recipientInput.trim(),
      dry: true,
    })
      .then((quote) => {
        if (!cancelled) {
          setStableflowQuote(quote);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStableflowQuote(undefined);
          setStableflowQuoteError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStableflowQuoteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    amount,
    amountInput,
    fetchStableflowWithdrawQuote,
    isBridge,
    quoteEnabled,
    recipientInput,
    selectedToken,
  ]);

  const stableflowDisplay = useMemo(
    () => (stableflowQuote ? mapStableflowQuoteToConfirmDisplay(stableflowQuote) : undefined),
    [stableflowQuote],
  );

  const breakdown = useMemo(() => {
    if (isBridge) {
      return bridgeQuote ? mapQuoteToBreakdown(bridgeQuote) : undefined;
    }
    return stableflowQuote ? mapStableflowQuoteToBreakdown(stableflowQuote) : undefined;
  }, [bridgeQuote, isBridge, stableflowQuote]);

  const receiveTokenAmount = isBridge
    ? bridgeQuote
      ? formatQuoteTokenAmount(bridgeQuote.estToTokenBaseUnit, selectedToken?.decimals ?? 6)
      : undefined
    : stableflowDisplay?.receiveAmountFormatted;

  const quoteLoading = isBridge ? bridgeQuoteLoading : stableflowQuoteLoading;
  const quoteError = isBridge ? bridgeQuoteError : stableflowQuoteError;

  const receiveLabel =
    quoteLoading && quoteEnabled
      ? "…"
      : receiveTokenAmount && selectedToken
        ? isBridge
          ? `${formatNumber(receiveTokenAmount, 4, true, { round: 0 })} ${selectedToken.symbol}`
          : receiveTokenAmount
        : "--";

  const fiatLabel =
    quoteLoading && quoteEnabled
      ? "…"
      : isBridge && bridgeQuote
        ? `~${formatNumber(bridgeQuote.estOutputUsd, 2, true, { round: 0 })}`
        : stableflowDisplay
          ? `~${formatNumber(stableflowDisplay.estOutputUsd, 2, true, { round: 0 })}`
          : "--";

  const isBusy =
    submitting ||
    status === "preparing" ||
    status === "awaiting_wallet" ||
    status === "polling" ||
    status === "syncing" ||
    (step === "status" && operationPhase !== "idle" && operationPhase !== "error" && operationPhase !== "success");

  const canSubmit =
    !assetsLoadingForMethod &&
    !!session?.walletAddress &&
    !!selectedToken &&
    !!recipientInput.trim() &&
    formError === undefined &&
    quoteError === undefined &&
    amount !== undefined &&
    !isBusy;

  const resetForm = useCallback(() => {
    setStep(INITIAL_STEP);
    setWithdrawMethod("bridge");
    setAmountInput("");
    setSelectedChain(undefined);
    setSelectedToken(undefined);
    setRecipientInput("");
    setStableflowQuote(undefined);
    setStableflowQuoteError(undefined);
    setChainDropdownOpen(false);
    setTokenDropdownOpen(false);
    setSubmitting(false);
    stopStatusPoll();
  }, [stopStatusPoll]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const loadStableflowTokens = useCallback(async () => {
    setStableflowTokensLoading(true);

    try {
      const payload = await fetchJson<{ tokens: StableflowWithdrawToken[] }>(
        "/api/trading/stableflow/tokens",
      );
      setStableflowTokens(payload.tokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
      throw error;
    } finally {
      setStableflowTokensLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (step === "form") {
      setStep("entry");
      setAmountInput("");
      setSelectedChain(undefined);
      setSelectedToken(undefined);
      setStableflowQuote(undefined);
      return;
    }

    if (step === "status") {
      setStep("form");
      stopStatusPoll();
    }
  }, [step, stopStatusPoll]);

  const handleChainSelect = useCallback((chain: SupportedChainOption) => {
    setSelectedChain(chain);
    setChainDropdownOpen(false);
    setTokenDropdownOpen(false);
  }, []);

  const handleTokenSelect = useCallback((token: WithdrawSelectableToken) => {
    setSelectedToken(token);
    setTokenDropdownOpen(false);
  }, []);

  const handleMax = useCallback(() => {
    setAmountInput(
      removeNumberEndZero(
        Big(portfolio?.availableToTrade || 0).toFixed(POLYMARKET_USD.decimals, Big.roundDown),
      ),
    );
  }, [portfolio?.availableToTrade]);

  const handleWithdraw = useCallback(async () => {
    if (!canSubmit || !session?.walletAddress || !selectedToken || amount === undefined) {
      return;
    }

    setSubmitting(true);
    setStep("status");

    try {
      await ensureTradingChain(session.walletAddress);
      let txHash: string | undefined;

      if (isBridge && !("assetId" in selectedToken)) {
        const result = await executeBridgeWithdraw({
          toChainId: String(selectedToken.chainId),
          toTokenAddress: selectedToken.address,
          recipientAddr: recipientInput.trim(),
          amountUsd: amount,
        });
        txHash = result.txHash;
      } else if (isStableflowWithdrawSelectableToken(selectedToken)) {
        const result = await executeStableflowWithdraw({
          amountUsd: amount,
          destinationToken: selectedToken,
          recipient: recipientInput.trim(),
        });
        txHash = result.txHash;
      } else {
        throw new Error(tWithdraw("unsupportedToken"));
      }

      void reportFundingTransaction({
        type: "withdraw",
        txHash: txHash ?? "",
        amount: String(amount)
      });

      toast.success(tWithdraw("withdrawalSubmitted"));
      handleClose();
      reload();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    amount,
    canSubmit,
    executeBridgeWithdraw,
    executeStableflowWithdraw,
    handleClose,
    isBridge,
    recipientInput,
    reload,
    selectedToken,
    session,
    tWithdraw,
  ]);

  const onSelectStableflow = async () => {
    try {
      if (stableflowTokens.length === 0) {
        await loadStableflowTokens();
      }

      setWithdrawMethod("stableflow");
      setSelectedChain(undefined);
      setSelectedToken(undefined);
      setStep("form");
    } catch {
      // toast already shown
    }
  };

  const modalWidth = step === "entry" ? WITHDRAW_MODAL_WIDTH.entry : WITHDRAW_MODAL_WIDTH.form;
  const showBack = step === "form" || step === "status";
  const showFooter = step === "form";

  const ariaLabel =
    step === "entry"
      ? tWithdraw("ariaEntry")
      : step === "status"
        ? tWithdraw("ariaStatus")
        : tWithdraw("ariaFunds");

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={handleClose}
      ariaLabel={ariaLabel}
      className={modalWidth}
      hideCloseButton
      overlayCloseable={false}
    >
      <FundingModalShell
        title={t("withdrawLabel")}
        onClose={handleClose}
        onBack={showBack ? handleBack : undefined}
        className={
          step === "entry"
            ? "min-h-0 md:min-h-[400px]"
            : "min-h-0 md:min-h-[680px]"
        }
        footer={
          showFooter ? (
            <button
              type="button"
              className={fundingPrimaryButtonClass}
              disabled={!canSubmit}
              onClick={() => void handleWithdraw()}
            >
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("withdrawLabel")}
            </button>
          ) : undefined
        }
      >
        {step === "entry" ? (
          <WithdrawEntryStep
            onSelectBridge={() => {
              setWithdrawMethod("bridge");
              setStep("form");
            }}
            onSelectStableflow={() => void onSelectStableflow()}
            stableflowLoading={stableflowTokensLoading}
          />
        ) : null}

        {step === "form" ? (
          <div className="flex flex-col gap-5 pb-10 md:pb-2">
            <div className="flex flex-col gap-2">
              <span className={withdrawFieldLabelClass}>{tWithdraw("recipientAddress")}</span>
              <div className={withdrawInputBoxClass}>
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(event) => setRecipientInput(event.target.value)}
                  className={withdrawAmountInputClass}
                  placeholder="0x…"
                  aria-label={tWithdraw("recipientAddressAria")}
                  spellCheck={false}
                />
              </div>
              {recipientError ? (
                <p className="m-0 text-sm text-prophet-red">{recipientError}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <span className={withdrawFieldLabelClass}>{tWithdraw("amount")}</span>
              <div className={withdrawInputBoxClass}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  className={withdrawAmountInputClass}
                  placeholder="0"
                  aria-label={tWithdraw("amountAria")}
                />
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-base font-[500] text-[#909090]">
                    {WITHDRAW_SOURCE_TOKEN_LABEL}
                  </span>
                  <button
                    type="button"
                    className={withdrawMaxButtonClass}
                    onClick={handleMax}
                  >
                    {tWithdraw("max")}
                  </button>
                </span>
              </div>
              {formError && amountInput.trim() ? (
                <p className="m-0 text-sm text-prophet-red">{formError}</p>
              ) : null}
              {quoteError ? (
                <p className="m-0 text-sm text-prophet-red">
                  {tWithdraw("quoteUnavailable")}
                </p>
              ) : null}
              {withdrawError && step === "form" ? (
                <p className="m-0 text-sm text-prophet-red">{withdrawError}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FundingSelectorDropdown
                label={tWithdraw("receiveChain")}
                triggerLabel={
                  selectedChain?.chainName ??
                  (assetsLoadingForMethod ? tCommon("loading") : tWithdraw("selectChain"))
                }
                disabled={assetsLoadingForMethod || chainOptions.length === 0}
                open={chainDropdownOpen}
                onOpenChange={(next) => {
                  setChainDropdownOpen(next);
                  if (next) {
                    setTokenDropdownOpen(false);
                  }
                }}
                triggerIcon={
                  selectedChain ? (
                    <TokenIcon
                      symbol="USDC"
                      chainLabel={selectedChain.chainName}
                      chainIcon={selectedChain.chainIcon}
                      size="sm"
                      chainOnly
                    />
                  ) : null
                }
              >
                {chainOptions.map((chain) => (
                  <button
                    key={chain.chainId}
                    type="button"
                    role="option"
                    aria-selected={selectedChain?.chainId === chain.chainId}
                    className={cn(
                      depositTokenRowClass,
                      "w-full",
                      selectedChain?.chainId === chain.chainId &&
                      depositTokenRowSelectedClass
                    )}
                    onClick={() => handleChainSelect(chain)}
                  >
                    <TokenIcon
                      symbol="USDC"
                      chainLabel={chain.chainName}
                      chainIcon={chain.chainIcon}
                      size="sm"
                      chainOnly
                    />
                    <span className="text-sm font-[500] text-black">
                      {chain.chainName}
                    </span>
                  </button>
                ))}
              </FundingSelectorDropdown>

              <FundingSelectorDropdown
                label={t("receiveToken")}
                triggerLabel={
                  selectedToken?.symbol ??
                  (assetsLoadingForMethod ? tCommon("loading") : tWithdraw("selectToken"))
                }
                disabled={assetsLoadingForMethod || tokensForChain.length === 0}
                open={tokenDropdownOpen}
                onOpenChange={(next) => {
                  setTokenDropdownOpen(next);
                  if (next) {
                    setChainDropdownOpen(false);
                  }
                }}
                triggerIcon={
                  selectedToken ? (
                    <TokenIcon
                      symbol={selectedToken.symbol}
                      icon={selectedToken.icon}
                      size="sm"
                    />
                  ) : null
                }
              >
                {tokensForChain.map((token) => (
                  <button
                    key={`${token.chainId}-${token.address}`}
                    type="button"
                    role="option"
                    aria-selected={
                      selectedToken?.chainId === token.chainId &&
                      selectedToken?.address === token.address
                    }
                    className={cn(
                      depositTokenRowClass,
                      "w-full",
                      selectedToken?.chainId === token.chainId &&
                      selectedToken?.address === token.address &&
                      depositTokenRowSelectedClass
                    )}
                    onClick={() => handleTokenSelect(token)}
                  >
                    <TokenIcon
                      symbol={token.symbol}
                      chainLabel={token.chainName}
                      icon={token.icon}
                      chainIcon={token.chainIcon}
                      size="sm"
                    />
                    <span className="text-sm font-[500] text-black">
                      {token.symbol}
                    </span>
                  </button>
                ))}
              </FundingSelectorDropdown>
            </div>

            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center justify-between">
                <span className={withdrawFieldLabelClass}>{tWithdraw("estReceive")}</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-base font-[500] text-black">
                    {receiveLabel}
                  </span>
                  <span className="text-base font-[500] text-[#909090]">
                    {fiatLabel}
                  </span>
                </div>
              </div>
            </div>

            <TransactionBreakdown
              loading={(quoteLoading || stableflowQuoteLoading) && quoteEnabled}
              networkCostUsd={breakdown?.networkCost}
              priceImpactPercent={breakdown?.priceImpactPercent}
              maxSlippagePercent={breakdown?.maxSlippagePercent}
            />
          </div>
        ) : null}

        {step === "status" ? (
          <WithdrawStatusStep
            phase={operationPhase}
            detail={operationDetail}
            error={withdrawError}
          />
        ) : null}
      </FundingModalShell>
    </FundingResponsiveOverlay>
  );
}
