export function isStrategyBidSkipPreValidationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STRATEGY_BID_SKIP_PRE_VALIDATION === "true";
}
