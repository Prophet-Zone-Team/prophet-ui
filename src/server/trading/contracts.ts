import "server-only";

import { getContractConfig } from "@polymarket/clob-client-v2";

import { getTradingChainId } from "./clobAuth";

export function getTradingContractAddresses() {
  const config = getContractConfig(getTradingChainId());

  return {
    collateralToken: config.collateral,
    conditionalTokens: config.conditionalTokens,
    exchange: config.exchangeV2,
    negRiskExchange: config.negRiskExchangeV2,
  };
}
