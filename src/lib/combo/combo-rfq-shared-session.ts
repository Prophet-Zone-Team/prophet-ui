"use client";

import {
  COMBO_RFQ_CREATE_DEBOUNCE_MS,
  COMBO_RFQ_EXECUTION_TIMEOUT_MS,
  COMBO_RFQ_QUOTE_ENSURE_TIMEOUT_MS,
} from "@/config/combo-rfq";
import {
  formatComboAcceptOrderForWs,
  getSharedComboRfqWsClient,
} from "@/lib/combo/combo-rfq-ws-client";
import { isQuoteExpired, toE6String } from "@/lib/combo/estimate-preview";
import { fetchComboRfqWsAuth } from "@/lib/combo/fetch-combo-rfq-ws-auth";
import {
  mapRfqWsQuoteReadyToSnapshot,
  matchesComboRfqParamsFingerprint,
} from "@/lib/combo/map-rfq-ws-quote";
import type {
  ComboExchangeV3Order,
  ComboQuoteSnapshot,
  ComboRfqDirection,
  ComboSubmitResult,
} from "@/types/combo";
import type {
  ComboRfqWsAuthPayload,
  ComboRfqWsServerMessage,
} from "@/types/combo-rfq-ws";

type SendCreateMode = "initial" | "refresh";

interface QuoteWaiter {
  fingerprint: string;
  resolve: (quote: ComboQuoteSnapshot) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

export interface ComboRfqConsumer {
  id: string;
  fingerprint: string;
  enabled: boolean;
  legPositionIds: string[];
  direction: ComboRfqDirection;
  size: number;
}

export interface ComboRfqConsumerSnapshot {
  quote: ComboQuoteSnapshot | undefined;
  quoteLoading: boolean;
  quoteError: string | undefined;
}

const EMPTY_SNAPSHOT: ComboRfqConsumerSnapshot = {
  quote: undefined,
  quoteLoading: false,
  quoteError: undefined,
};

function consumerEquals(a: ComboRfqConsumer, b: ComboRfqConsumer): boolean {
  return (
    a.fingerprint === b.fingerprint &&
    a.enabled === b.enabled &&
    a.direction === b.direction &&
    a.size === b.size
  );
}

class ComboRfqSharedSession {
  private readonly client = getSharedComboRfqWsClient();
  private readonly consumers = new Map<string, ComboRfqConsumer>();
  private readonly quotesByFingerprint = new Map<string, ComboQuoteSnapshot>();
  private readonly loadingFingerprints = new Set<string>();
  private readonly errorsByFingerprint = new Map<string, string>();
  private readonly snapshotCache = new Map<string, ComboRfqConsumerSnapshot>();
  private readonly storeListeners = new Set<() => void>();
  private readonly quoteWaiters: QuoteWaiter[] = [];

  private retainCount = 0;
  private listenerCleanup: (() => void) | undefined;
  private authPayload: ComboRfqWsAuthPayload | undefined;
  private activeFingerprint: string | undefined;
  private activeConsumerId: string | undefined;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private quoteLoadTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private refreshingFingerprint: string | undefined;
  private paused = false;
  private generation = 0;

  subscribe(listener: () => void): () => void {
    this.storeListeners.add(listener);
    return () => {
      this.storeListeners.delete(listener);
    };
  }

  getConsumerSnapshot(consumerId: string): ComboRfqConsumerSnapshot {
    const consumer = this.consumers.get(consumerId);

    if (!consumer?.enabled) {
      return EMPTY_SNAPSHOT;
    }

    const next: ComboRfqConsumerSnapshot = {
      quote: this.quotesByFingerprint.get(consumer.fingerprint),
      quoteLoading: this.loadingFingerprints.has(consumer.fingerprint),
      quoteError: this.errorsByFingerprint.get(consumer.fingerprint),
    };

    const cached = this.snapshotCache.get(consumerId);

    if (
      cached &&
      cached.quote === next.quote &&
      cached.quoteLoading === next.quoteLoading &&
      cached.quoteError === next.quoteError
    ) {
      return cached;
    }

    this.snapshotCache.set(consumerId, next);
    return next;
  }

  upsertConsumer(consumer: ComboRfqConsumer): void {
    const existing = this.consumers.get(consumer.id);

    if (existing && consumerEquals(existing, consumer)) {
      return;
    }

    this.consumers.set(consumer.id, consumer);
    this.reconcileActiveConsumer();
    this.emit();
  }

  removeConsumer(consumerId: string): void {
    if (!this.consumers.has(consumerId)) {
      return;
    }

    this.consumers.delete(consumerId);
    this.snapshotCache.delete(consumerId);
    this.reconcileActiveConsumer();
    this.emit();
  }

  async ensureQuote(consumerId: string): Promise<ComboQuoteSnapshot> {
    const consumer = this.consumers.get(consumerId);

    if (!consumer?.enabled) {
      throw new Error("Combo RFQ quoting is not enabled.");
    }

    const current = this.quotesByFingerprint.get(consumer.fingerprint);

    if (current && !isQuoteExpired(current.expiresAt)) {
      return current;
    }

    const quotePromise = this.waitForQuote(consumer.fingerprint);

    if (this.refreshingFingerprint !== consumer.fingerprint) {
      void this.sendCreate(consumer, current ? "refresh" : "initial");
    }

    return quotePromise;
  }

  async acceptQuote(input: {
    quote: ComboQuoteSnapshot;
    signedOrder: ComboExchangeV3Order;
  }): Promise<ComboSubmitResult> {
    this.paused = true;
    this.clearDebounce();
    this.generation += 1;

    try {
      await this.ensureConnected();

      const wsOrder = formatComboAcceptOrderForWs({
        ...input.signedOrder,
        side: input.signedOrder.side,
        expiration: input.signedOrder.expiration ?? "0",
      });

      const result = await this.client.acceptQuote({
        rfqId: input.quote.rfqId,
        quoteId: input.quote.quoteId,
        signedOrder: wsOrder,
        timeoutMs: COMBO_RFQ_EXECUTION_TIMEOUT_MS,
      });

      this.paused = false;
      this.reconcileActiveConsumer();
      return result;
    } catch (error) {
      this.paused = false;
      this.reconcileActiveConsumer();
      throw error;
    }
  }

  resumeQuoting(consumerId: string): void {
    const consumer = this.consumers.get(consumerId);

    if (!consumer?.enabled) {
      return;
    }

    this.paused = false;
    this.scheduleCreate(consumer, "initial");
  }

  disconnectConsumer(consumerId: string): void {
    this.removeConsumer(consumerId);
  }

  private emit(): void {
    for (const listener of this.storeListeners) {
      listener();
    }
  }

  private getActiveConsumer(): ComboRfqConsumer | undefined {
    const enabled = [...this.consumers.values()].filter((consumer) => consumer.enabled);
    return enabled.at(-1);
  }

  private reconcileActiveConsumer(): void {
    const active = this.getActiveConsumer();
    const shouldConnect = Boolean(active) && !this.paused;

    if (!shouldConnect) {
      this.activeConsumerId = undefined;
      this.activeFingerprint = undefined;
      this.teardownConnection();
      return;
    }

    this.ensureConnection();

    if (
      active!.id !== this.activeConsumerId ||
      active!.fingerprint !== this.activeFingerprint
    ) {
      this.activeConsumerId = active!.id;
      this.activeFingerprint = active!.fingerprint;
      this.scheduleCreate(active!, "initial");
    }
  }

  private ensureConnection(): void {
    if (this.retainCount > 0) {
      this.client.resetForReuse();
      return;
    }

    this.retainCount = 1;
    this.listenerCleanup = this.client.subscribe((message) => {
      this.handleServerMessage(message);
    });
    this.client.resetForReuse();
  }

  private teardownConnection(): void {
    if (this.retainCount === 0) {
      return;
    }

    this.retainCount = 0;
    this.clearDebounce();
    this.clearAllQuoteLoadTimeouts();
    this.loadingFingerprints.clear();
    this.rejectQuoteWaiters(new Error("Combo RFQ quoting disabled."));
    this.listenerCleanup?.();
    this.listenerCleanup = undefined;
    this.authPayload = undefined;
    this.refreshingFingerprint = undefined;
    this.client.disconnect();
  }

  private clearDebounce(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  private scheduleCreate(consumer: ComboRfqConsumer, mode: SendCreateMode): void {
    this.clearDebounce();
    this.debounceTimer = setTimeout(() => {
      void this.sendCreate(consumer, mode);
    }, COMBO_RFQ_CREATE_DEBOUNCE_MS);
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isConnected()) {
      return;
    }

    if (!this.authPayload) {
      this.authPayload = await fetchComboRfqWsAuth();
    }

    this.client.resetForReuse();
    await this.client.connect(this.authPayload);
  }

  private async sendCreate(
    consumer: ComboRfqConsumer,
    mode: SendCreateMode = "initial",
  ): Promise<void> {
    if (this.paused || !consumer.enabled) {
      return;
    }

    if (mode === "refresh" && this.refreshingFingerprint === consumer.fingerprint) {
      return;
    }

    const generation = ++this.generation;
    this.activeConsumerId = consumer.id;
    this.activeFingerprint = consumer.fingerprint;
    const isRefresh = mode === "refresh";

    if (isRefresh) {
      this.refreshingFingerprint = consumer.fingerprint;
    } else {
      this.quotesByFingerprint.delete(consumer.fingerprint);
      this.loadingFingerprints.add(consumer.fingerprint);
      this.startQuoteLoadTimeout(consumer.fingerprint);
    }

    this.errorsByFingerprint.delete(consumer.fingerprint);
    this.emit();

    try {
      await this.ensureConnected();

      if (
        generation !== this.generation ||
        this.activeFingerprint !== consumer.fingerprint ||
        this.paused
      ) {
        if (!isRefresh) {
          this.clearQuoteLoadState(consumer.fingerprint);
          this.emit();
        }

        return;
      }

      this.client.send({
        type: "RFQ_CREATE",
        leg_position_ids: consumer.legPositionIds,
        direction: consumer.direction,
        side: "YES",
        requested_size:
          consumer.direction === "SELL"
            ? {
                unit: "shares",
                value_e6: toE6String(consumer.size),
              }
            : {
                unit: "notional",
                value_e6: toE6String(consumer.size),
              },
      });
    } catch (error) {
      if (generation !== this.generation) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      this.authPayload = undefined;

      if (!isRefresh) {
        this.quotesByFingerprint.delete(consumer.fingerprint);
      }

      this.clearQuoteLoadState(consumer.fingerprint);
      this.errorsByFingerprint.set(consumer.fingerprint, message);
      this.refreshingFingerprint = undefined;
      this.rejectQuoteWaiters(new Error(message));
      this.emit();
    }
  }

  private startQuoteLoadTimeout(fingerprint: string): void {
    this.clearQuoteLoadTimeout(fingerprint);

    const timeoutId = setTimeout(() => {
      this.quoteLoadTimers.delete(fingerprint);

      if (
        this.quotesByFingerprint.has(fingerprint) ||
        !this.loadingFingerprints.has(fingerprint)
      ) {
        return;
      }

      this.clearQuoteLoadState(fingerprint);
      const message = "Combo quote timed out. Try again.";
      this.errorsByFingerprint.set(fingerprint, message);
      this.rejectQuoteWaiters(new Error(message));
      this.emit();
    }, COMBO_RFQ_QUOTE_ENSURE_TIMEOUT_MS);

    this.quoteLoadTimers.set(fingerprint, timeoutId);
  }

  private clearQuoteLoadTimeout(fingerprint: string): void {
    const timeoutId = this.quoteLoadTimers.get(fingerprint);

    if (timeoutId) {
      clearTimeout(timeoutId);
      this.quoteLoadTimers.delete(fingerprint);
    }
  }

  private clearAllQuoteLoadTimeouts(): void {
    for (const timeoutId of this.quoteLoadTimers.values()) {
      clearTimeout(timeoutId);
    }

    this.quoteLoadTimers.clear();
  }

  private clearQuoteLoadState(fingerprint: string): void {
    this.clearQuoteLoadTimeout(fingerprint);
    this.loadingFingerprints.delete(fingerprint);
  }

  private waitForQuote(fingerprint: string): Promise<ComboQuoteSnapshot> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.quoteWaiters.splice(
          this.quoteWaiters.findIndex((waiter) => waiter.timeoutId === timeoutId),
          1,
        );
        reject(new Error("Combo quote refresh timed out. Try again."));
      }, COMBO_RFQ_QUOTE_ENSURE_TIMEOUT_MS);

      this.quoteWaiters.push({
        fingerprint,
        resolve,
        reject,
        timeoutId,
      });
    });
  }

  private resolveQuoteWaiters(
    fingerprint: string,
    quote: ComboQuoteSnapshot,
  ): void {
    const matching = this.quoteWaiters.filter(
      (waiter) => waiter.fingerprint === fingerprint,
    );
    this.quoteWaiters.splice(
      0,
      this.quoteWaiters.length,
      ...this.quoteWaiters.filter((waiter) => waiter.fingerprint !== fingerprint),
    );

    for (const waiter of matching) {
      clearTimeout(waiter.timeoutId);
      waiter.resolve(quote);
    }
  }

  private rejectQuoteWaiters(error: Error): void {
    for (const waiter of this.quoteWaiters) {
      clearTimeout(waiter.timeoutId);
      waiter.reject(error);
    }

    this.quoteWaiters.length = 0;
  }

  private handleServerMessage(message: ComboRfqWsServerMessage): void {
    if (this.paused) {
      return;
    }

    if (message.type === "RFQ_QUOTE_READY") {
      const activeFingerprint = this.activeFingerprint;

      if (
        !activeFingerprint ||
        !matchesComboRfqParamsFingerprint(message.request, activeFingerprint)
      ) {
        return;
      }

      try {
        const nextQuote = mapRfqWsQuoteReadyToSnapshot({
          request: message.request,
          quote: message.quote,
        });

        this.quotesByFingerprint.set(activeFingerprint, nextQuote);
        this.clearQuoteLoadState(activeFingerprint);
        this.errorsByFingerprint.delete(activeFingerprint);
        this.refreshingFingerprint = undefined;
        this.resolveQuoteWaiters(activeFingerprint, nextQuote);
        this.emit();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.quotesByFingerprint.delete(activeFingerprint);
        this.clearQuoteLoadState(activeFingerprint);
        this.errorsByFingerprint.set(activeFingerprint, errorMessage);
        this.refreshingFingerprint = undefined;
        this.rejectQuoteWaiters(new Error(errorMessage));
        this.emit();
      }

      return;
    }

    if (message.type === "RFQ_STATUS_UPDATE") {
      const activeFingerprint = this.activeFingerprint;
      const activeConsumer = this.activeConsumerId
        ? this.consumers.get(this.activeConsumerId)
        : undefined;

      if (
        message.code === "EXPIRED_RFQ" &&
        activeFingerprint &&
        activeConsumer &&
        this.refreshingFingerprint !== activeFingerprint
      ) {
        void this.sendCreate(activeConsumer, "refresh");
      }
    }
  }
}

export const comboRfqSharedSession = new ComboRfqSharedSession();
