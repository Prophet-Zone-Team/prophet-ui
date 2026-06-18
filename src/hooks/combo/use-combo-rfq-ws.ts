"use client";

import { useCallback, useEffect, useId, useMemo, useSyncExternalStore } from "react";

import {
  buildComboRfqParamsFingerprint,
} from "@/lib/combo/map-rfq-ws-quote";
import { comboRfqSharedSession } from "@/lib/combo/combo-rfq-shared-session";
import type {
  ComboExchangeV3Order,
  ComboQuoteSnapshot,
  ComboRfqDirection,
  ComboSubmitResult,
} from "@/types/combo";

export interface UseComboRfqWsOptions {
  legPositionIds: string[];
  direction: ComboRfqDirection;
  /** USD notional for BUY; share count for SELL. */
  size: number;
  enabled: boolean;
}

export interface UseComboRfqWsResult {
  quote: ComboQuoteSnapshot | undefined;
  /** True while waiting for the first quote (no prior snapshot). */
  quoteLoading: boolean;
  quoteError: string | undefined;
  /** Returns a non-expired quote, refreshing over WS when needed. */
  ensureQuote: () => Promise<ComboQuoteSnapshot>;
  acceptQuote: (input: {
    quote: ComboQuoteSnapshot;
    signedOrder: ComboExchangeV3Order;
  }) => Promise<ComboSubmitResult>;
  resumeQuoting: () => void;
  disconnect: () => void;
}

export function useComboRfqWs(options: UseComboRfqWsOptions): UseComboRfqWsResult {
  const { legPositionIds, direction, size, enabled } = options;
  const consumerId = useId();

  const fingerprint = useMemo(
    () =>
      buildComboRfqParamsFingerprint({
        legPositionIds,
        direction,
        size,
      }),
    [direction, legPositionIds, size],
  );

  useEffect(() => {
    comboRfqSharedSession.upsertConsumer({
      id: consumerId,
      fingerprint,
      enabled,
      legPositionIds,
      direction,
      size,
    });

    return () => {
      comboRfqSharedSession.removeConsumer(consumerId);
    };
  }, [consumerId, direction, enabled, fingerprint, legPositionIds, size]);

  const subscribe = useCallback(
    (listener: () => void) => comboRfqSharedSession.subscribe(listener),
    [],
  );

  const getSnapshot = useCallback(
    () => comboRfqSharedSession.getConsumerSnapshot(consumerId),
    [consumerId],
  );

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const ensureQuote = useCallback(
    () => comboRfqSharedSession.ensureQuote(consumerId),
    [consumerId],
  );

  const acceptQuote = useCallback(
    (input: {
      quote: ComboQuoteSnapshot;
      signedOrder: ComboExchangeV3Order;
    }) => comboRfqSharedSession.acceptQuote(input),
    [],
  );

  const resumeQuoting = useCallback(
    () => comboRfqSharedSession.resumeQuoting(consumerId),
    [consumerId],
  );

  const disconnect = useCallback(
    () => comboRfqSharedSession.disconnectConsumer(consumerId),
    [consumerId],
  );

  return {
    quote: snapshot.quote,
    quoteLoading: snapshot.quoteLoading,
    quoteError: snapshot.quoteError,
    ensureQuote,
    acceptQuote,
    resumeQuoting,
    disconnect,
  };
}
