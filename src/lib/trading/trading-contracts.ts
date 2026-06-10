import { getContractConfig } from "@polymarket/clob-client-v2";

import { POLYGON_CHAIN_ID, POLYGON_COLLATERAL_CONTRACTS } from "@/lib/market/polymarket-collateral-contracts";

export function getTradingContractAddresses() {
  const config = getContractConfig(POLYGON_CHAIN_ID);

  return {
    collateralToken: config.collateral,
    conditionalTokens: config.conditionalTokens,
    exchange: config.exchangeV2,
    negRiskExchange: config.negRiskExchangeV2,
    negRiskAdapter: config.negRiskAdapter,
    ctfCollateralAdapter: POLYGON_COLLATERAL_CONTRACTS.ctfCollateralAdapter,
    negRiskCtfCollateralAdapter: POLYGON_COLLATERAL_CONTRACTS.negRiskCtfCollateralAdapter,
  };
}
