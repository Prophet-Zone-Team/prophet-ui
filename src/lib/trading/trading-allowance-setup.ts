export interface TradingTokenAllowances {
  conditionalTokens?: number;
  exchange?: number;
  negRiskExchange?: number;
  negRiskAdapter?: number;
}

export function isTradingTokenAllowanceAuthorized(
  allowances: TradingTokenAllowances | undefined,
): boolean {
  if (!allowances) {
    return false;
  }

  const { conditionalTokens, exchange, negRiskExchange, negRiskAdapter } = allowances;

  return (
    conditionalTokens !== undefined &&
    exchange !== undefined &&
    negRiskExchange !== undefined &&
    negRiskAdapter !== undefined &&
    conditionalTokens > 0 &&
    exchange > 0 &&
    negRiskExchange > 0 &&
    negRiskAdapter > 0
  );
}
