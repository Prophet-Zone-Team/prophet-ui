import {
  COMBO_RFQ_WS_AUTH_TIMEOUT_MS,
  COMBO_RFQ_WS_RECONNECT_BASE_MS,
  COMBO_RFQ_WS_RECONNECT_MAX_MS,
  COMBO_RFQ_WS_URL,
} from "@/config/combo-rfq";
import type {
  ComboRfqWsAuthPayload,
  ComboRfqWsClientMessage,
  ComboRfqWsServerMessage,
  ComboRfqWsSignedOrderPayload,
} from "@/types/combo-rfq-ws";
import type { ComboExecutionStatus, ComboSubmitResult } from "@/types/combo";

export type ComboRfqWsListener = (message: ComboRfqWsServerMessage) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseServerMessage(raw: unknown): ComboRfqWsServerMessage | undefined {
  if (!isRecord(raw) || typeof raw.type !== "string") {
    return undefined;
  }

  return raw as ComboRfqWsServerMessage;
}

function parsePayload(data: string): ComboRfqWsServerMessage[] {
  if (!data.trim()) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => parseServerMessage(item))
      .filter((item): item is ComboRfqWsServerMessage => item !== undefined);
  }

  const message = parseServerMessage(parsed);
  return message ? [message] : [];
}

interface AcceptWaiter {
  resolve: (result: ComboSubmitResult) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class ComboRfqWsClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private disposed = false;
  private authPayload: ComboRfqWsAuthPayload | undefined;
  private authenticated = false;
  private connectPromise: Promise<void> | undefined;
  private readonly listeners = new Set<ComboRfqWsListener>();
  private readonly acceptWaiters = new Map<string, AcceptWaiter>();

  subscribe(listener: ComboRfqWsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN && this.authenticated;
  }

  async connect(authPayload: ComboRfqWsAuthPayload): Promise<void> {
    this.authPayload = authPayload;

    if (this.isConnected()) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = this.openConnection(authPayload).finally(() => {
      this.connectPromise = undefined;
    });

    return this.connectPromise;
  }

  disconnect(): void {
    this.disposed = true;
    this.clearReconnectTimer();
    this.rejectAllAcceptWaiters(new Error("Combo RFQ WebSocket disconnected."));
    this.authenticated = false;
    this.authPayload = undefined;

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  resetForReuse(): void {
    this.disposed = false;
    this.reconnectAttempt = 0;
  }

  send(message: ComboRfqWsClientMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Combo RFQ WebSocket is not connected.");
    }

    this.socket.send(JSON.stringify(message));
  }

  async acceptQuote(input: {
    rfqId: string;
    quoteId: string;
    signedOrder: ComboRfqWsSignedOrderPayload;
    timeoutMs: number;
  }): Promise<ComboSubmitResult> {
    if (!this.isConnected()) {
      throw new Error("Combo RFQ WebSocket is not connected.");
    }

    const existing = this.acceptWaiters.get(input.rfqId);

    if (existing) {
      clearTimeout(existing.timeoutId);
      existing.reject(new Error("Combo RFQ accept superseded."));
      this.acceptWaiters.delete(input.rfqId);
    }

    const resultPromise = new Promise<ComboSubmitResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.acceptWaiters.delete(input.rfqId);
        reject(new Error("Combo RFQ accept timed out before execution completed."));
      }, input.timeoutMs);

      this.acceptWaiters.set(input.rfqId, {
        resolve,
        reject,
        timeoutId,
      });
    });

    this.send({
      type: "RFQ_ACCEPT",
      rfq_id: input.rfqId,
      quote_id: input.quoteId,
      signed_order: input.signedOrder,
    });

    return resultPromise;
  }

  private async openConnection(authPayload: ComboRfqWsAuthPayload): Promise<void> {
    if (typeof WebSocket === "undefined") {
      throw new Error("WebSocket is not available in this environment.");
    }

    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }

    this.authenticated = false;

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(COMBO_RFQ_WS_URL);
      this.socket = socket;

      const authTimeoutId = setTimeout(() => {
        if (!this.authenticated) {
          socket.close();
          reject(new Error("Combo RFQ WebSocket authentication timed out."));
        }
      }, COMBO_RFQ_WS_AUTH_TIMEOUT_MS);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: "auth",
            auth: authPayload.auth,
            identity: authPayload.identity,
          } satisfies ComboRfqWsClientMessage),
        );
      };

      socket.onmessage = (event) => {
        const messages = parsePayload(String(event.data));

        for (const message of messages) {
          if (message.type === "auth") {
            clearTimeout(authTimeoutId);

            if (!message.success) {
              reject(new Error(message.error ?? "Combo RFQ WebSocket authentication failed."));
              socket.close();
              return;
            }

            this.authenticated = true;
            this.reconnectAttempt = 0;
            resolve();
          }

          this.dispatch(message);
        }
      };

      socket.onerror = () => {
        clearTimeout(authTimeoutId);

        if (!this.authenticated) {
          reject(new Error("Combo RFQ WebSocket connection failed."));
        }
      };

      socket.onclose = () => {
        clearTimeout(authTimeoutId);
        this.authenticated = false;
        this.socket = null;

        if (!this.disposed && this.authPayload) {
          this.scheduleReconnect();
        }
      };
    });
  }

  private dispatch(message: ComboRfqWsServerMessage): void {
    if (message.type === "RFQ_EXECUTION_UPDATE" || message.type === "ACK_RFQ_ACCEPT") {
      this.handleExecutionMessage(message);
    }

    for (const listener of this.listeners) {
      listener(message);
    }
  }

  private handleExecutionMessage(
    message:
      | Extract<ComboRfqWsServerMessage, { type: "RFQ_EXECUTION_UPDATE" }>
      | Extract<ComboRfqWsServerMessage, { type: "ACK_RFQ_ACCEPT" }>,
  ): void {
    const rfqId = message.rfq_id;
    const waiter = this.acceptWaiters.get(rfqId);

    if (!waiter) {
      return;
    }

    if (message.type === "ACK_RFQ_ACCEPT") {
      return;
    }

    const executionStatus = mapWsExecutionStatus(message.status);

    if (executionStatus === "CONFIRMED" || executionStatus === "FAILED") {
      clearTimeout(waiter.timeoutId);
      this.acceptWaiters.delete(rfqId);
      waiter.resolve({
        rfqId,
        executionStatus,
        txHash: message.tx_hash,
        error: executionStatus === "FAILED" ? "Combo order execution failed." : undefined,
      });
      return;
    }

    if (executionStatus === "MINED" && message.tx_hash) {
      clearTimeout(waiter.timeoutId);
      this.acceptWaiters.delete(rfqId);
      waiter.resolve({
        rfqId,
        executionStatus: "CONFIRMED",
        txHash: message.tx_hash,
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed || !this.authPayload || this.reconnectTimer) {
      return;
    }

    const delay = Math.min(
      COMBO_RFQ_WS_RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      COMBO_RFQ_WS_RECONNECT_MAX_MS,
    );

    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      if (this.disposed || !this.authPayload) {
        return;
      }

      void this.connect(this.authPayload).catch(() => {
        this.scheduleReconnect();
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private rejectAllAcceptWaiters(error: Error): void {
    for (const [rfqId, waiter] of this.acceptWaiters.entries()) {
      clearTimeout(waiter.timeoutId);
      waiter.reject(error);
      this.acceptWaiters.delete(rfqId);
    }
  }
}

function mapWsExecutionStatus(status: string): ComboExecutionStatus {
  const normalized = status.toUpperCase();

  if (normalized === "CONFIRMED") {
    return "CONFIRMED";
  }

  if (normalized === "FAILED") {
    return "FAILED";
  }

  if (normalized === "MINED") {
    return "MINED";
  }

  if (normalized === "MATCHED") {
    return "MATCHED";
  }

  if (normalized === "RETRYING") {
    return "PENDING";
  }

  return "PENDING";
}

let sharedClient: ComboRfqWsClient | undefined;

export function getSharedComboRfqWsClient(): ComboRfqWsClient {
  if (!sharedClient) {
    sharedClient = new ComboRfqWsClient();
  }

  return sharedClient;
}

export function formatComboAcceptOrderForWs(
  order: ComboRfqWsSignedOrderPayload,
): ComboRfqWsSignedOrderPayload {
  const side =
    order.side === 1 || order.side === "SELL" ? "SELL" : "BUY";

  return {
    ...order,
    side,
    expiration: order.expiration ?? "0",
  };
}
