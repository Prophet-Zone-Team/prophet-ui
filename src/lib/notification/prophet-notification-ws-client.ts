import {
  buildProphetWsUrl,
  PROPHET_WS_HEARTBEAT_INTERVAL_MS,
  PROPHET_WS_PONG_TIMEOUT_MS,
  PROPHET_WS_RECONNECT_BASE_MS,
  PROPHET_WS_RECONNECT_MAX_MS
} from "@/config/prophet-ws";
import { parseProphetWsNotificationMessage } from "@/lib/notification/parse-prophet-ws-message";
import type { ProphetNotificationData } from "@/types/prophet-notification-ws";

export type ProphetNotificationWsListener = (
  data: ProphetNotificationData
) => void;

export type ProphetNotificationWsStatusListener = (
  status: "connecting" | "open" | "closed" | "error"
) => void;

export class ProphetNotificationWsClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private intentionalClose = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly messageListeners = new Set<ProphetNotificationWsListener>();
  private readonly statusListeners =
    new Set<ProphetNotificationWsStatusListener>();

  subscribe(listener: ProphetNotificationWsListener): () => void {
    this.messageListeners.add(listener);

    return () => {
      this.messageListeners.delete(listener);
    };
  }

  subscribeStatus(listener: ProphetNotificationWsStatusListener): () => void {
    this.statusListeners.add(listener);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  connect(token: string): void {
    const trimmed = token.trim();

    if (!trimmed) {
      this.disconnect();
      return;
    }

    if (this.token === trimmed && this.isSocketActive()) {
      return;
    }

    this.token = trimmed;
    this.intentionalClose = false;
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.token = null;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.closeSocket();
    this.emitStatus("closed");
  }

  private isSocketActive(): boolean {
    return (
      this.socket !== null &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    );
  }

  private openSocket(): void {
    if (typeof WebSocket === "undefined" || !this.token) {
      return;
    }

    this.closeSocket();
    this.clearReconnectTimer();
    this.emitStatus("connecting");

    const socket = new WebSocket(buildProphetWsUrl(this.token));
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.startHeartbeat();
      this.emitStatus("open");
    };

    socket.onmessage = (event) => {
      const data = String(event.data);

      if (data === "PONG") {
        this.markPong();
        return;
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }

      const message = parseProphetWsNotificationMessage(parsed);

      if (!message) {
        return;
      }

      for (const listener of this.messageListeners) {
        listener(message.data);
      }
    };

    socket.onerror = () => {
      this.emitStatus("error");
    };

    socket.onclose = () => {
      this.socket = null;
      this.stopHeartbeat();
      this.emitStatus("closed");

      if (!this.intentionalClose && this.token) {
        this.scheduleReconnect();
      }
    };
  }

  private closeSocket(): void {
    if (!this.socket) {
      return;
    }

    this.socket.onopen = null;
    this.socket.onmessage = null;
    this.socket.onerror = null;
    this.socket.onclose = null;
    this.socket.close();
    this.socket = null;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      this.socket.send(
        JSON.stringify({
          method: "PING",
          params: [],
          id: Date.now()
        })
      );

      if (this.pongTimer) {
        clearTimeout(this.pongTimer);
      }

      this.pongTimer = setTimeout(() => {
        if (this.socket) {
          this.socket.close();
        }
      }, PROPHET_WS_PONG_TIMEOUT_MS);
    }, PROPHET_WS_HEARTBEAT_INTERVAL_MS);
  }

  private markPong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    const delay = Math.min(
      PROPHET_WS_RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      PROPHET_WS_RECONNECT_MAX_MS
    );

    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      if (this.token && !this.intentionalClose) {
        this.openSocket();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emitStatus(status: "connecting" | "open" | "closed" | "error"): void {
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}

let clientInstance: ProphetNotificationWsClient | null = null;

export function getProphetNotificationWsClient(): ProphetNotificationWsClient {
  if (!clientInstance) {
    clientInstance = new ProphetNotificationWsClient();
  }

  return clientInstance;
}
