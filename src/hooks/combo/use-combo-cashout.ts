"use client";

import { useCallback, useMemo, useState } from "react";

import { useAuth } from "@/context/auth";
import { useComboRfqWs } from "@/hooks/combo/use-combo-rfq-ws";
import { signComboAcceptOrder } from "@/lib/combo/sign-combo-accept";
import { getRuntimeTranslator } from "@/lib/i18n/runtime-messages";
import {
  formatComboCashoutToastSummary,
  showComboOrderErrorToast,
  showComboOrderProgressToast,
  showComboOrderSubmittedToast,
  updateComboOrderProgressToast,
} from "@/lib/trading/order-toast";
import type { PortfolioComboPositionCard } from "@/lib/portfolio/combo-positions/types";
import { ensureTradingReadyForBid } from "@/views/trade/trade-widget/trade-ticket-helpers";

export interface UseComboCashoutOptions {
  combo: PortfolioComboPositionCard | null;
  open: boolean;
  onSuccess?: () => void;
}

export interface UseComboCashoutResult {
  cashoutAmount: number | undefined;
  isSubmitting: boolean;
  isCashoutDisabled: boolean;
  isAuthenticated: boolean;
  submitCashout: () => Promise<void>;
}

export function useComboCashout(options: UseComboCashoutOptions): UseComboCashoutResult {
  const { combo, open, onSuccess } = options;
  const auth = useAuth();
  const [status, setStatus] = useState<"idle" | "signing" | "submitting">("idle");

  const legPositionIds = combo?.legPositionIds ?? [];
  const sharesBalance = combo?.sharesBalance ?? 0;

  const wsEnabled =
    open &&
    Boolean(combo) &&
    legPositionIds.length > 0 &&
    sharesBalance > 0 &&
    auth.isAuthenticated &&
    auth.setupSteps.clobSigned;

  const rfqWs = useComboRfqWs({
    legPositionIds,
    direction: "SELL",
    size: sharesBalance,
    enabled: wsEnabled,
  });

  const executableQuote = wsEnabled ? rfqWs.quote : undefined;
  const hasLiveQuote = Boolean(executableQuote);

  const cashoutAmount = hasLiveQuote
    ? executableQuote!.estimatedToWin
    : combo?.cashoutAmount;

  const isQuotePending = wsEnabled && rfqWs.quoteLoading && !hasLiveQuote;
  const isSubmitting = status === "signing" || status === "submitting";

  const isCashoutDisabled =
    !open ||
    !combo ||
    sharesBalance <= 0 ||
    isSubmitting ||
    !auth.isAuthenticated ||
    auth.isRegionBlocked ||
    (auth.setupSteps.clobSigned && (!hasLiveQuote || isQuotePending));

  const submitCashout = useCallback(async () => {
    if (isCashoutDisabled || !executableQuote) {
      return;
    }

    setStatus("signing");

    const tCombo = getRuntimeTranslator("combo");
    const progressToastId = showComboOrderProgressToast(tCombo("signingCashout"));

    try {
      const readiness = await ensureTradingReadyForBid({
        session: auth.session,
        authReadiness: auth.readiness,
        orderReadiness: auth.readiness,
        previewCanSubmit: true,
        tradeSide: "sell",
        isBuyRestricted: false,
        isRegionFullyBlocked: auth.isRegionBlocked,
        openLogin: auth.openLogin,
        signClobCredentials: auth.signClobCredentials,
        signTokenApprovals: auth.signTokenApprovals,
        refreshSetupReadiness: auth.refreshSetupReadiness,
        skipFundingReadiness: true,
      });

      if (!readiness.ok) {
        if (readiness.action === "open_login") {
          await auth.openLogin();
        }

        throw new Error(readiness.message);
      }

      const session = auth.session;

      if (!session?.walletAddress || !session.funderAddress) {
        throw new Error("Connected wallet and deposit wallet are required.");
      }

      const quote = await rfqWs.ensureQuote();

      const signed = await signComboAcceptOrder({
        quote,
        walletAddress: session.walletAddress,
        funderAddress: session.funderAddress,
      });

      updateComboOrderProgressToast(progressToastId, tCombo("submittingCashout"));
      setStatus("submitting");

      const result = await rfqWs.acceptQuote({
        quote,
        signedOrder: signed.signedOrder,
      });

      if (result.executionStatus === "FAILED") {
        throw new Error(result.error ?? "Combo cashout execution failed.");
      }

      showComboOrderSubmittedToast(
        formatComboCashoutToastSummary(quote.estimatedToWin),
        progressToastId,
      );

      onSuccess?.();
    } catch (error) {
      showComboOrderErrorToast(error, progressToastId);
      rfqWs.resumeQuoting();
    } finally {
      setStatus("idle");
    }
  }, [
    auth,
    executableQuote,
    isCashoutDisabled,
    onSuccess,
    rfqWs,
  ]);

  return {
    cashoutAmount,
    isSubmitting,
    isCashoutDisabled,
    isAuthenticated: auth.isAuthenticated,
    submitCashout,
  };
}
