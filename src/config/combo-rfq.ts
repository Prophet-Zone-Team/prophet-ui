/** Single Combo RFQ gateway — quotes and order accept flow over WebSocket only. */
export const COMBO_RFQ_WS_URL =
  "wss://combos-rfq-gateway-requester.polymarket.sh/ws";

export const COMBO_RFQ_WS_AUTH_TIMEOUT_MS = 25_000;
export const COMBO_RFQ_CREATE_DEBOUNCE_MS = 300;
export const COMBO_RFQ_EXECUTION_TIMEOUT_MS = 15_000;
export const COMBO_RFQ_QUOTE_ENSURE_TIMEOUT_MS = 15_000;
export const COMBO_RFQ_WS_RECONNECT_BASE_MS = 500;
export const COMBO_RFQ_WS_RECONNECT_MAX_MS = 8_000;
