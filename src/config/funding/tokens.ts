export interface FundingNetwork {
  chainId: number;
  chainName: string;
  chainIcon: string;
}

export interface FundingToken extends FundingNetwork {
  symbol: string;
  address: string;
  decimals: number;
  icon: string;
}

export interface FundingAsset extends FundingToken {
  minCheckoutUsd: number;
  name: string;
}

export const FUNDING_NETWORKS: Record<string, FundingNetwork> = {
  arbitrum: {
    chainId: 42161,
    chainName: "Arbitrum",
    chainIcon: "/networks/arbitrum.png",
  },
  optimism: {
    chainId: 10,
    chainName: "Optimism",
    chainIcon: "/networks/optimism.png",
  },
};

export const FUNDING_TOKENS: Record<string, Record<string, FundingToken>> = {
  arbitrum: {
    "WETH": {
      ...FUNDING_NETWORKS.arbitrum,
      symbol: "WETH",
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      decimals: 18,
      icon: "/tokens/weth.png",
    },
    "DAI": {
      ...FUNDING_NETWORKS.arbitrum,
      symbol: "DAI",
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      decimals: 18,
      icon: "/tokens/dai.png",
    },
    "ETH": {
      ...FUNDING_NETWORKS.arbitrum,
      symbol: "ETH",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      decimals: 18,
      icon: "/tokens/eth.png",
    },
    "USDC.e": {
      ...FUNDING_NETWORKS.arbitrum,
      symbol: "USDC.e",
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      decimals: 6,
      icon: "/tokens/usdc.png",
    },
    "USDT": {
      ...FUNDING_NETWORKS.arbitrum,
      symbol: "USDT",
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      decimals: 6,
      icon: "/tokens/usdt.png",
    },
    "USDC": {
      ...FUNDING_NETWORKS.arbitrum,
      symbol: "USDC",
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      decimals: 6,
      icon: "/tokens/usdc.png",
    },
    "WBTC": {
      ...FUNDING_NETWORKS.arbitrum,
      symbol: "WBTC",
      address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      decimals: 8,
      icon: "/tokens/wbtc.png",
    },
  },
  optimism: {
    "USDT": {
      ...FUNDING_NETWORKS.optimism,
      symbol: "USDT",
      address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      decimals: 6,
      icon: "/tokens/usdt.png",
    },
    "USD₮0": {
      ...FUNDING_NETWORKS.optimism,
      symbol: "USD₮0",
      address: "0x01bFF41798a0BcF287b996046Ca68b395DbC1071",
      decimals: 6,
      icon: "/tokens/usdt0.png",
    },
    "USDC": {
      ...FUNDING_NETWORKS.optimism,
      symbol: "USDC",
      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      decimals: 6,
      icon: "/tokens/usdc.png",
    },
    "WETH": {
      ...FUNDING_NETWORKS.optimism,
      symbol: "WETH",
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
      icon: "/tokens/weth.png",
    },
    "USDC.e": {
      ...FUNDING_NETWORKS.optimism,
      symbol: "USDC.e",
      address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      decimals: 6,
      icon: "/tokens/usdc.png",
    },
    "DAI": {
      ...FUNDING_NETWORKS.optimism,
      symbol: "DAI",
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      decimals: 18,
      icon: "/tokens/dai.png",
    },
    "ETH": {
      ...FUNDING_NETWORKS.optimism,
      symbol: "ETH",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      decimals: 18,
      icon: "/tokens/eth.png",
    },
  },
};

export const FUNDING_TOKENS_LIST = Object.values(FUNDING_TOKENS).flatMap(item => Object.values(item));
