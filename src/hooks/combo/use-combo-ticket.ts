"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth";
import { useComboRfqWs } from "@/hooks/combo/use-combo-rfq-ws";
import {
  estimateComboPreview,
  isQuoteExpired
} from "@/lib/combo/estimate-preview";
import { signComboAcceptOrder } from "@/lib/combo/sign-combo-accept";
import { getRuntimeTranslator } from "@/lib/i18n/runtime-messages";
import {
  formatComboBuyToastSummary,
  showComboOrderErrorToast,
  showComboOrderProgressToast,
  showComboOrderSubmittedToast,
  updateComboOrderProgressToast
} from "@/lib/trading/order-toast";
import { resolveTradeTicketAvailableCash } from "@/lib/trading/cash-balance-model";
import type {
  ComboQuoteSnapshot,
  ComboQuoteSource,
  ComboTicketLeg,
  ComboTicketStatus
} from "@/types/combo";
import { ensureTradingReadyForBid } from "@/views/trade/trade-widget/trade-ticket-helpers";
import { MIN_COMBO_PICKS } from "@/views/combo/combo-widget/constants";

export interface UseComboTicketOptions {
  legs: ComboTicketLeg[];
  bidAmount: number;
  enabled?: boolean;
  onSubmitSuccess?: () => void;
}

export interface UseComboTicketResult {
  previewMultiplier: number;
  previewToWin: number;
  executableQuote: ComboQuoteSnapshot | undefined;
  multiplier: number;
  toWinAmount: number;
  quoteSource: ComboQuoteSource;
  quoteLoading: boolean;
  isQuotePending: boolean;
  quoteError: string | undefined;
  isQuoteStale: boolean;
  status: ComboTicketStatus;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  isAuthenticated: boolean;
  submitError: string | undefined;
  submit: () => Promise<void>;
}

export function useComboTicket(
  options: UseComboTicketOptions
): UseComboTicketResult {
  const { legs, bidAmount, enabled = true, onSubmitSuccess } = options;

  const auth = useAuth();
  const [status, setStatus] = useState<ComboTicketStatus>("idle");
  const [submitError, setSubmitError] = useState<string | undefined>();

  const preview = useMemo(
    () => estimateComboPreview({ legs, bidAmountUsd: bidAmount }),
    [bidAmount, legs]
  );

  const balance = useMemo(
    () => resolveTradeTicketAvailableCash(auth.readiness) ?? 0,
    [auth.readiness]
  );

  const legPositionIds = useMemo(
    () => legs.map((leg) => leg.legPositionId).filter(Boolean),
    [legs]
  );

  const canRequestQuote =
    enabled &&
    legs.length >= MIN_COMBO_PICKS &&
    bidAmount > 0 &&
    legs.every((leg) => leg.legPositionId.trim().length > 0);

  const wsEnabled =
    canRequestQuote && auth.isAuthenticated && auth.setupSteps.clobSigned;

  const rfqWs = useComboRfqWs({
    legPositionIds,
    direction: "BUY",
    size: bidAmount,
    enabled: wsEnabled
  });

  const executableQuote = wsEnabled ? rfqWs.quote : undefined;
  const quoteLoading = wsEnabled ? rfqWs.quoteLoading : false;
  const quoteError = wsEnabled ? rfqWs.quoteError : undefined;

  const hasLiveQuote = Boolean(executableQuote);

  const isQuoteStale = useMemo(
    () => (executableQuote ? isQuoteExpired(executableQuote.expiresAt) : false),
    [executableQuote]
  );

  const quoteSource: ComboQuoteSource = hasLiveQuote ? "rfq" : "estimated";

  const multiplier = hasLiveQuote
    ? executableQuote!.multiplier
    : preview.multiplier;
  const toWinAmount = hasLiveQuote
    ? executableQuote!.estimatedToWin
    : preview.toWinAmount;

  const isQuotePending = wsEnabled && quoteLoading && !hasLiveQuote;

  const isSubmitting = status === "signing" || status === "submitting";

  const isSubmitDisabled =
    !canRequestQuote ||
    isSubmitting ||
    !auth.isAuthenticated ||
    auth.isBuyRestricted ||
    bidAmount > balance ||
    legs.some((leg) => leg.referencePrice <= 0) ||
    (auth.setupSteps.clobSigned &&
      wsEnabled &&
      (!hasLiveQuote || isQuotePending || isQuoteStale));

  const submit = useCallback(async () => {
    if (isSubmitDisabled) {
      return;
    }

    setSubmitError(undefined);
    setStatus("signing");

    let progressToastId: string | undefined;

    try {
      const session = auth.session;

      if (!session?.walletAddress || !session.funderAddress) {
        throw new Error("Connected wallet and deposit wallet are required.");
      }

      const quote = wsEnabled ? await rfqWs.ensureQuote() : executableQuote;

      if (!quote) {
        throw new Error("Executable combo quote is not available yet.");
      }

      const readiness = await ensureTradingReadyForBid({
        session: auth.session,
        authReadiness: auth.readiness,
        orderReadiness: auth.readiness,
        previewCanSubmit: true,
        isBuyRestricted: auth.isBuyRestricted,
        isRegionFullyBlocked: auth.isRegionBlocked,
        openLogin: auth.openLogin,
        signClobCredentials: auth.signClobCredentials,
        signTokenApprovals: auth.signTokenApprovals,
        refreshSetupReadiness: auth.refreshSetupReadiness,
        skipFundingReadiness: true
      });

      if (!readiness.ok) {
        if (readiness.action === "open_login") {
          await auth.openLogin();
        }

        throw new Error(readiness.message);
      }

      const tCombo = getRuntimeTranslator("combo");
      progressToastId = String(
        showComboOrderProgressToast(tCombo("signingCombo"))
      );

      const signed = await signComboAcceptOrder({
        quote,
        walletAddress: session.walletAddress,
        funderAddress: session.funderAddress
      });

      updateComboOrderProgressToast(progressToastId, tCombo("submittingCombo"));
      setStatus("submitting");

      const finalResult = await rfqWs.acceptQuote({
        quote,
        signedOrder: signed.signedOrder
      });

      if (finalResult.executionStatus === "FAILED") {
        throw new Error(finalResult.error ?? "Combo order execution failed.");
      }

      showComboOrderSubmittedToast(
        formatComboBuyToastSummary({
          bidAmountUsd: bidAmount,
          toWinAmount: quote.estimatedToWin,
          pickCount: legs.length
        }),
        progressToastId
      );

      setStatus("success");
      onSubmitSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus("error");
      setSubmitError(message);
      showComboOrderErrorToast(
        error,
        progressToastId ?? `combo-error-${Date.now()}`
      );
      rfqWs.resumeQuoting();
    } finally {
      setStatus((current) => (current === "success" ? "success" : "idle"));
    }
  }, [
    auth,
    bidAmount,
    executableQuote,
    isSubmitDisabled,
    legs.length,
    onSubmitSuccess,
    rfqWs,
    wsEnabled
  ]);

  useEffect(() => {
    if (!canRequestQuote) {
      setSubmitError(undefined);
    }
  }, [canRequestQuote]);

  return {
    previewMultiplier: preview.multiplier,
    previewToWin: preview.toWinAmount,
    executableQuote,
    multiplier,
    toWinAmount,
    quoteSource,
    quoteLoading,
    isQuotePending,
    quoteError,
    isQuoteStale,
    status,
    isSubmitting,
    isSubmitDisabled,
    isAuthenticated: auth.isAuthenticated,
    submitError,
    submit
  };
}
