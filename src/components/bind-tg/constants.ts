export const BIND_TG_MODAL_WIDTH = "w-[394px]";
export const BIND_TG_MODAL_HEIGHT = "h-[444px]";

export const BIND_TG_STEPS = [
  { step: 1, label: "Open your telegram" },
  { step: 2, label: "Click Starts to authorize access" },
  { step: 3, label: "Return here and wait for success" }
] as const;

export const DEFAULT_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "prophet_stg_bot";
export const DEFAULT_POLL_INTERVAL_SECONDS = 3;
