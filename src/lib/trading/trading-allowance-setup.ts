export interface TradingTokenAllowances {
  conditionalTokens?: number;
  exchange?: number;
  negRiskExchange?: number;
}

export function isTradingTokenAllowanceAuthorized(
  allowances: TradingTokenAllowances | undefined,
): boolean {
  if (!allowances) {
    return false;
  }

  const { conditionalTokens, exchange, negRiskExchange } = allowances;

  return (
    conditionalTokens !== undefined &&
    exchange !== undefined &&
    negRiskExchange !== undefined &&
    conditionalTokens > 0 &&
    exchange > 0 &&
    negRiskExchange > 0
  );
}
