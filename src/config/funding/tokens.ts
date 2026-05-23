import { FUNDING_NETWORKS, FundingNetwork } from "./networks";

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
  bsc: {
    "WBTC": {
      ...FUNDING_NETWORKS.bsc,
      symbol: "WBTC",
      address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
      decimals: 8,
      icon: "/tokens/wbtc.png",
    },
    "DAI": {
      ...FUNDING_NETWORKS.bsc,
      symbol: "DAI",
      address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
      decimals: 18,
      icon: "/tokens/dai.png",
    },
    "ETH": {
      ...FUNDING_NETWORKS.bsc,
      symbol: "ETH",
      address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      decimals: 18,
      icon: "/tokens/eth.png",
    },
    "USDT": {
      ...FUNDING_NETWORKS.bsc,
      symbol: "USDT",
      address: "0x55d398326f99059fF775485246999027B3197955",
      decimals: 18,
      icon: "/tokens/usdt.png",
    },
    "USDC": {
      ...FUNDING_NETWORKS.bsc,
      symbol: "USDC",
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      decimals: 18,
      icon: "/tokens/usdc.png",
    },
    "BNB": {
      ...FUNDING_NETWORKS.bsc,
      symbol: "BNB",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      decimals: 18,
      icon: "/tokens/bnb.png",
    },
    "FDUSD": {
      ...FUNDING_NETWORKS.bsc,
      symbol: "FDUSD",
      address: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409",
      decimals: 18,
      icon: "/tokens/fdusd.png",
    },
    "USD1": {
      ...FUNDING_NETWORKS.bsc,
      symbol: "USD1",
      address: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
      decimals: 18,
      icon: "/tokens/usd1.png",
    },
  },
  polygon: {
    "USDT": {
      ...FUNDING_NETWORKS.polygon,
      symbol: "USDT",
      address: "0x9417669fBF23357D2774e9D421307bd5eA1006d2",
      decimals: 6,
      icon: "/tokens/usdt.png",
    },
    "USDT0": {
      ...FUNDING_NETWORKS.polygon,
      symbol: "USDT0",
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      decimals: 6,
      icon: "/tokens/usdt.png",
    },
    "USDC.e": {
      ...FUNDING_NETWORKS.polygon,
      symbol: "USDC.e",
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      decimals: 6,
      icon: "/tokens/usdc.png",
    },
    "USDC": {
      ...FUNDING_NETWORKS.polygon,
      symbol: "USDC",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimals: 6,
      icon: "/tokens/usdc.png",
    },
    "DAI": {
      ...FUNDING_NETWORKS.polygon,
      symbol: "DAI",
      address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      decimals: 18,
      icon: "/tokens/dai.png",
    },
    "WETH": {
      ...FUNDING_NETWORKS.polygon,
      symbol: "WETH",
      address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      decimals: 18,
      icon: "/tokens/weth.png",
    },
    "POL": {
      ...FUNDING_NETWORKS.polygon,
      symbol: "POL",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      decimals: 18,
      icon: "/tokens/pol.webp",
    },
  }
};

export const FUNDING_TOKENS_LIST = Object.values(FUNDING_TOKENS).flatMap(item => Object.values(item));

export const STABLECOIN_SYMBOLS = new Set(["USDC", "USDT", "USDC.e", "USD₮0", "DAI", "FDUSD", "USD1"]);

export const POLYMARKET_USD: FundingToken & { underlyingToken: FundingToken; } = {
  ...FUNDING_NETWORKS.polygon,
  symbol: "USDC (Prophet)",
  address: "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB",
  decimals: 18,
  icon: "/tokens/pusd.png",
  underlyingToken: {
    ...FUNDING_NETWORKS.polygon,
    symbol: "USDC.e",
    address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    decimals: 6,
    icon: "/tokens/usdc.png",
  },
};
