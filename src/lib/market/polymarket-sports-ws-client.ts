import {
  POLYMARKET_SPORTS_WS_DISPOSE_DELAY_MS,
  POLYMARKET_SPORTS_WS_RECONNECT_BASE_MS,
  POLYMARKET_SPORTS_WS_RECONNECT_MAX_MS,
  POLYMARKET_SPORTS_WS_URL,
} from "@/config/polymarket-sports-ws";
import type { PolymarketSportsWsUpdate } from "@/types/polymarket-sports-ws";

export type SportsWsListener = (update: PolymarketSportsWsUpdate) => void;


function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function parseSportsWsUpdate(raw: any): PolymarketSportsWsUpdate | undefined {
  const slug = readNonEmptyString(raw.slug);
  const gameId = raw.gameId;

  if (!gameId) {
    return undefined;
  }

  return {
    slug,
    gameId,
    live: typeof raw.live === "boolean" ? raw.live : undefined,
    ended: typeof raw.ended === "boolean" ? raw.ended : undefined,
    score: typeof raw.score === "string" ? raw.score : undefined,
    period: typeof raw.period === "string" ? raw.period : undefined,
    elapsed: typeof raw.elapsed === "string" ? raw.elapsed : undefined,
    last_update:
      typeof raw.last_update === "string" ? raw.last_update : undefined,
    finished_timestamp:
      typeof raw.finished_timestamp === "string"
        ? raw.finished_timestamp
        : undefined,
    turn: typeof raw.turn === "string" ? raw.turn : undefined
  };
}

export class PolymarketSportsWsClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposeTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private disposed = false;
  private readonly listeners = new Set<SportsWsListener>();

  subscribe(listener: SportsWsListener): () => void {
    this.resetIfDisposed();
    this.listeners.add(listener);
    this.ensureConnection();

    return () => {
      this.listeners.delete(listener);
      this.scheduleDisposeIfIdle();
    };
  }

  private resetIfDisposed(): void {
    if (!this.disposed) {
      return;
    }

    this.disposed = false;
    this.reconnectAttempt = 0;
  }

  private scheduleDisposeIfIdle(): void {
    if (this.listeners.size > 0) {
      return;
    }

    this.clearDisposeTimer();
    this.disposeTimer = setTimeout(() => {
      if (this.listeners.size === 0) {
        this.dispose();
      }
    }, POLYMARKET_SPORTS_WS_DISPOSE_DELAY_MS);
  }

  private clearDisposeTimer(): void {
    if (this.disposeTimer) {
      clearTimeout(this.disposeTimer);
      this.disposeTimer = null;
    }
  }

  private dispose(): void {
    this.disposed = true;
    this.clearReconnectTimer();
    this.clearDisposeTimer();

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
  }

  private ensureConnection(): void {
    if (this.disposed || this.listeners.size === 0) {
      return;
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.connect();
  }

  private connect(): void {
    if (this.disposed || typeof WebSocket === "undefined") {
      return;
    }

    this.clearReconnectTimer();

    const socket = new WebSocket(POLYMARKET_SPORTS_WS_URL);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
    };

    socket.onmessage = (message) => {
      const data = String(message.data);

      if (data === "ping") {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send("pong");
        }

        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }
      const update = parseSportsWsUpdate(parsed);

      if (!update) {
        return;
      }

      for (const listener of this.listeners) {
        listener(update);
      }
    };

    socket.onerror = () => {
      // Reconnect handled in onclose.
    };

    socket.onclose = () => {
      this.socket = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.disposed || this.listeners.size === 0) {
      return;
    }

    this.clearReconnectTimer();

    const delay = Math.min(
      POLYMARKET_SPORTS_WS_RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      POLYMARKET_SPORTS_WS_RECONNECT_MAX_MS
    );

    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

let clientInstance: PolymarketSportsWsClient | null = null;

export function getPolymarketSportsWsClient(): PolymarketSportsWsClient {
  if (!clientInstance) {
    clientInstance = new PolymarketSportsWsClient();
  }

  return clientInstance;
}
