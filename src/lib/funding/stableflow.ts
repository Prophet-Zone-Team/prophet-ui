import { QuoteRequest, type QuoteResponse, type TokenResponse } from "@stableflow/core";

import { FUNDING_NETWORKS, FundingNetworkType, type FundingNetwork } from "@/config/funding/networks";
import type { FundingAsset } from "@/config/funding/tokens";

export const POLYGON_USDC_NATIVE = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";

export const STABLEFLOW_BLOCKCHAIN_TO_CHAIN_ID: Record<string, number> = {
  pol: FUNDING_NETWORKS.polygon.chainId,
  arb: FUNDING_NETWORKS.arbitrum.chainId,
  op: FUNDING_NETWORKS.optimism.chainId,
  bsc: FUNDING_NETWORKS.bsc.chainId,
};

const TOKEN_ICON_BY_SYMBOL: Record<string, string> = {
  USDC: "/tokens/usdc.png",
  "USDC.e": "/tokens/usdc.png",
  USDT: "/tokens/usdt.png",
  ETH: "/tokens/eth.png",
  WETH: "/tokens/weth.png",
  DAI: "/tokens/dai.png",
  WBTC: "/tokens/wbtc.png",
  BNB: "/tokens/bnb.png",
};

export interface StableflowDepositToken extends FundingAsset {
  assetId: string;
  blockchain: string;
  price: number;
}

export interface StableflowQuoteDisplay {
  estCheckoutTimeMs: number;
  estInputUsd: number;
  estOutputUsd: number;
  estToTokenBaseUnit: string;
  receiveAmountFormatted: string;
}

export function getFundingNetworkForStableflowBlockchain(blockchain: string): FundingNetwork | undefined {
  const chainId = STABLEFLOW_BLOCKCHAIN_TO_CHAIN_ID[blockchain];

  if (!chainId) {
    return undefined;
  }

  return Object.values(FUNDING_NETWORKS).find((network) => network.chainId === chainId);
}

export function filterStableflowTokensForFundingNetworks(tokens: TokenResponse[]): TokenResponse[] {
  return tokens.filter((token) => {
    if (!token.contractAddress) {
      return false;
    }

    const network = getFundingNetworkForStableflowBlockchain(token.blockchain);

    return Boolean(network && network.chainType === FundingNetworkType.EVM);
  });
}

export function mapStableflowTokenToDepositToken(token: TokenResponse): StableflowDepositToken | undefined {
  const network = getFundingNetworkForStableflowBlockchain(token.blockchain);

  if (!network || !token.contractAddress) {
    return undefined;
  }

  const icon = TOKEN_ICON_BY_SYMBOL[token.symbol] ?? "/tokens/usdc.png";

  return {
    ...network,
    assetId: token.assetId,
    blockchain: token.blockchain,
    symbol: token.symbol,
    name: token.symbol,
    address: token.contractAddress,
    decimals: token.decimals,
    icon,
    minCheckoutUsd: 0,
    price: token.price,
  };
}

export function resolvePolygonUsdcDestinationAsset(tokens: TokenResponse[]): TokenResponse | undefined {
  return tokens.find(
    (token) =>
      token.blockchain === "pol" &&
      token.symbol === "USDC" &&
      token.contractAddress?.toLowerCase() === POLYGON_USDC_NATIVE,
  );
}

export function isPolygonNativeUsdcToken(token: Pick<StableflowDepositToken, "chainId" | "address">): boolean {
  return token.chainId === FUNDING_NETWORKS.polygon.chainId && token.address.toLowerCase() === POLYGON_USDC_NATIVE;
}

export function buildStableflowQuoteRequest({
  originAssetId,
  destinationAssetId,
  amountBaseUnits,
  refundTo,
  recipient,
}: {
  originAssetId: string;
  destinationAssetId: string;
  amountBaseUnits: string;
  refundTo: string;
  recipient: string;
}): QuoteRequest {
  return {
    dry: false,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 50,
    originAsset: originAssetId,
    destinationAsset: destinationAssetId,
    amount: amountBaseUnits,
    refundTo,
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
    recipient,
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    deadline: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

export function mapStableflowQuoteToConfirmDisplay(quote: QuoteResponse): StableflowQuoteDisplay {
  const estCheckoutTimeMs = (quote.quote.timeEstimate ?? 0) * 1000;

  return {
    estCheckoutTimeMs,
    estInputUsd: Number(quote.quote.amountInUsd ?? 0),
    estOutputUsd: Number(quote.quote.amountOutUsd ?? 0),
    estToTokenBaseUnit: quote.quote.amountOut,
    receiveAmountFormatted: quote.quote.amountOutFormatted,
  };
}

export function stableflowTokensToFundingTokens(tokens: StableflowDepositToken[]): FundingAsset[] {
  return tokens.map(({ assetId: _assetId, blockchain: _blockchain, price: _price, ...funding }) => funding);
}
