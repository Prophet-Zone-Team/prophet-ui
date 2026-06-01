import "server-only";

import { getContractConfig } from "@polymarket/clob-client-v2";

import { POLYGON_COLLATERAL_CONTRACTS } from "@/lib/market/polymarket-collateral-contracts";
import { getTradingChainId } from "@/server/trading/clob-auth";

export function getTradingContractAddresses() {
  const config = getContractConfig(getTradingChainId());

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
