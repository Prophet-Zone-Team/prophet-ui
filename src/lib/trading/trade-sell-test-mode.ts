export function isTradeSkipSellBalanceCheckEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TRADE_SKIP_SELL_BALANCE_CHECK === "true";
}
