export const copyTradeApiUpstream = (
  process.env.NEXT_PUBLIC_ENV === "production"
    ? "https://apicopy.prophet.zone"
    : "https://api.zerostrategy.fun"
).replace(/\/$/, "");

/** Show 7D PnL / FIFA 7D PnL column on copy-trade rank table. Off by default. */
export function isCopyTradeRankPnl7dEnabled(): boolean {
  return process.env.NEXT_PUBLIC_COPY_TRADE_RANK_PNL7D_ENABLED === "true";
}
