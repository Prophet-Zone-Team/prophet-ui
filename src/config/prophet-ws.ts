export function resolveProphetWsUrl(): string {
  return process.env.NEXT_PUBLIC_ENV === "production"
    ? "wss://ws.prophet.zone/ws"
    : "wss://ws_stg.prophet.zone/ws";
}

export function buildProphetWsUrl(token: string): string {
  return `${resolveProphetWsUrl()}?token=${encodeURIComponent(token)}`;
}

export const PROPHET_WS_HEARTBEAT_INTERVAL_MS = 15_000;

export const PROPHET_WS_PONG_TIMEOUT_MS = 30_000;

export const PROPHET_WS_RECONNECT_BASE_MS = 3_000;

export const PROPHET_WS_RECONNECT_MAX_MS = 30_000;

export const PROPHET_NOTIFICATION_DISPLAY_MS = 5_000;
