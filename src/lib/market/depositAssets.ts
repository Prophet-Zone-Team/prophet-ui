export const POLYGON_NETWORK = {
  chainId: 137,
  chainIdHex: "0x89",
  chainName: "Polygon",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: ["https://polygon-rpc.com"],
  blockExplorerUrls: ["https://polygonscan.com"],
} as const;

export const DEFAULT_DEPOSIT_ASSET = {
  chainId: POLYGON_NETWORK.chainId,
  chainIdHex: POLYGON_NETWORK.chainIdHex,
  chainName: POLYGON_NETWORK.chainName,
  name: "USDC",
  symbol: "USDC",
  address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  decimals: 6,
  minimumAmount: 2,
} as const;
