"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import {
  estimateComboPreview,
  isQuoteExpired,
} from "@/lib/combo/estimate-preview";
import { backendComboRfqClient } from "@/lib/combo/rfq-client";
import { signComboAcceptOrder } from "@/lib/combo/sign-combo-accept";
import { showOrderErrorToast } from "@/lib/trading/order-toast";
import { resolveTradeTicketAvailableCash } from "@/lib/trading/cash-balance-model";
import type {
  ComboQuoteSnapshot,
  ComboQuoteSource,
  ComboTicketLeg,
  ComboTicketStatus,
} from "@/types/combo";
import { ensureTradingReadyForBid } from "@/views/trade/trade-widget/trade-ticket-helpers";

const DEFAULT_DEBOUNCE_MS = 500;
const EXECUTION_POLL_INTERVAL_MS = 500;
const EXECUTION_POLL_TIMEOUT_MS = 15_000;

export interface UseComboTicketOptions {
  legs: ComboTicketLeg[];
  bidAmount: number;
  enabled?: boolean;
  debounceMs?: number;
}

export interface UseComboTicketResult {
  previewMultiplier: number;
  previewToWin: number;
  executableQuote: ComboQuoteSnapshot | undefined;
  multiplier: number;
  toWinAmount: number;
  quoteSource: ComboQuoteSource;
  quoteLoading: boolean;
  quoteError: string | undefined;
  isQuoteStale: boolean;
  status: ComboTicketStatus;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  submitError: string | undefined;
  reloadQuote: () => Promise<ComboQuoteSnapshot | undefined>;
  submit: () => Promise<void>;
}

export function useComboTicket(options: UseComboTicketOptions): UseComboTicketResult {
  const {
    legs,
    bidAmount,
    enabled = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = options;

  const auth = useAuth();
  const [executableQuote, setExecutableQuote] = useState<ComboQuoteSnapshot | undefined>();
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | undefined>();
  const [status, setStatus] = useState<ComboTicketStatus>("idle");
  const [submitError, setSubmitError] = useState<string | undefined>();
  const quoteAbortRef = useRef<AbortController | undefined>(undefined);
  const submitAbortRef = useRef<AbortController | undefined>(undefined);

  const preview = useMemo(
    () => estimateComboPreview({ legs, bidAmountUsd: bidAmount }),
    [bidAmount, legs],
  );

  const balance = useMemo(
    () => resolveTradeTicketAvailableCash(auth.readiness) ?? 0,
    [auth.readiness],
  );

  const quoteRequestKey = useMemo(
    () =>
      legs.length > 0 && bidAmount > 0
        ? `${legs.map((leg) => `${leg.legPositionId}:${leg.outcomeSide}`).join("|")}:${bidAmount}`
        : "",
    [bidAmount, legs],
  );

  const canRequestQuote =
    enabled &&
    legs.length > 0 &&
    bidAmount > 0 &&
    legs.every((leg) => leg.legPositionId.trim().length > 0);

  const isQuoteStale = useMemo(
    () =>
      executableQuote ? isQuoteExpired(executableQuote.expiresAt) : false,
    [executableQuote],
  );

  const quoteSource: ComboQuoteSource = executableQuote && !isQuoteStale ? "rfq" : "estimated";
  const multiplier =
    quoteSource === "rfq" && executableQuote
      ? executableQuote.multiplier
      : preview.multiplier;
  const toWinAmount =
    quoteSource === "rfq" && executableQuote
      ? executableQuote.estimatedToWin
      : preview.toWinAmount;

  const isSubmitting = status === "signing" || status === "submitting" || status === "quoting";

  const isSubmitDisabled =
    !canRequestQuote ||
    isSubmitting ||
    !auth.isAuthenticated ||
    auth.isBuyRestricted ||
    bidAmount > balance ||
    legs.some((leg) => leg.referencePrice <= 0);

  const reloadQuote = useCallback(
    async (force = false): Promise<ComboQuoteSnapshot | undefined> => {
      if (!canRequestQuote) {
        setExecutableQuote(undefined);
        setQuoteLoading(false);
        setQuoteError(undefined);
        return undefined;
      }

      if (!force && !auth.isAuthenticated) {
        return undefined;
      }

      quoteAbortRef.current?.abort();
      const controller = new AbortController();
      quoteAbortRef.current = controller;

      setQuoteLoading(true);
      setQuoteError(undefined);

      try {
        const quote = await backendComboRfqClient.requestQuote({
          legs,
          bidAmountUsd: bidAmount,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setExecutableQuote(quote);
          return quote;
        }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          return undefined;
        }

        const message = error instanceof Error ? error.message : String(error);
        setExecutableQuote(undefined);
        setQuoteError(message);

        if (force) {
          throw error;
        }
      } finally {
        if (!controller.signal.aborted) {
          setQuoteLoading(false);
        }
      }

      return undefined;
    },
    [auth.isAuthenticated, bidAmount, canRequestQuote, legs],
  );

  useEffect(() => {
    if (!canRequestQuote) {
      setExecutableQuote(undefined);
      setQuoteLoading(false);
      setQuoteError(undefined);
      return;
    }

    if (!auth.isAuthenticated) {
      return;
    }

    const timer = window.setTimeout(() => {
      void reloadQuote(false);
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      quoteAbortRef.current?.abort();
    };
  }, [auth.isAuthenticated, canRequestQuote, debounceMs, quoteRequestKey, reloadQuote]);

  const submit = useCallback(async () => {
    if (isSubmitDisabled) {
      return;
    }

    submitAbortRef.current?.abort();
    const controller = new AbortController();
    submitAbortRef.current = controller;

    setSubmitError(undefined);
    setStatus("quoting");

    try {
      const readiness = await ensureTradingReadyForBid({
        session: auth.session,
        authReadiness: auth.readiness,
        previewCanSubmit: true,
        isBuyRestricted: auth.isBuyRestricted,
        isRegionFullyBlocked: auth.isRegionBlocked,
        openLogin: auth.openLogin,
        signClobCredentials: auth.signClobCredentials,
        signTokenApprovals: auth.signTokenApprovals,
        refreshSetupReadiness: auth.refreshSetupReadiness,
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

      const quote = await reloadQuote(true);

      if (!quote) {
        throw new Error("Unable to refresh combo quote before submit.");
      }

      if (isQuoteExpired(quote.expiresAt)) {
        throw new Error("Combo quote expired. Refresh and try again.");
      }

      setStatus("signing");

      const signed = await signComboAcceptOrder({
        quote,
        walletAddress: session.walletAddress,
        funderAddress: session.funderAddress,
      });

      if (controller.signal.aborted) {
        return;
      }

      setStatus("submitting");

      const acceptResult = await backendComboRfqClient.acceptQuote({
        quote,
        signedOrder: signed.signedOrder,
        signal: controller.signal,
      });

      const finalResult = await waitForComboExecution({
        rfqId: quote.rfqId,
        initialResult: acceptResult,
        signal: controller.signal,
      });

      if (finalResult.executionStatus === "FAILED") {
        throw new Error(finalResult.error ?? "Combo order execution failed.");
      }

      setStatus("success");
      setExecutableQuote(undefined);
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      setStatus("error");
      setSubmitError(message);
      showOrderErrorToast(message);
    } finally {
      if (!controller.signal.aborted) {
        setStatus((current) => (current === "success" ? "success" : "idle"));
      }
    }
  }, [
    auth,
    isSubmitDisabled,
    reloadQuote,
  ]);

  return {
    previewMultiplier: preview.multiplier,
    previewToWin: preview.toWinAmount,
    executableQuote,
    multiplier,
    toWinAmount,
    quoteSource,
    quoteLoading,
    quoteError,
    isQuoteStale,
    status,
    isSubmitting,
    isSubmitDisabled,
    submitError,
    reloadQuote: () => reloadQuote(true),
    submit,
  };
}

async function waitForComboExecution(input: {
  rfqId: string;
  initialResult: Awaited<ReturnType<typeof backendComboRfqClient.acceptQuote>>;
  signal?: AbortSignal;
}) {
  if (
    input.initialResult.executionStatus === "CONFIRMED" ||
    input.initialResult.executionStatus === "FAILED"
  ) {
    return input.initialResult;
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < EXECUTION_POLL_TIMEOUT_MS) {
    if (input.signal?.aborted) {
      return input.initialResult;
    }

    await sleep(EXECUTION_POLL_INTERVAL_MS);

    const result = await backendComboRfqClient.pollExecution({
      rfqId: input.rfqId,
      signal: input.signal,
    });

    if (result.executionStatus === "CONFIRMED" || result.executionStatus === "FAILED") {
      return result;
    }
  }

  return input.initialResult;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
