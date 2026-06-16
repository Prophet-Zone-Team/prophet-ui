export type NearNetworkConfig = {
  networkId: "mainnet" | "testnet";
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
};

export const NEAR_NETWORK: NearNetworkConfig = {
  networkId: "mainnet",
  nodeUrl: "https://nearinner.deltarpc.com",
  walletUrl: "https://app.mynearwallet.com/",
  helperUrl: "https://helper.mainnet.near.org",
  explorerUrl: "https://nearblocks.io",
};

/** NEAR chain-signatures (MPC) contract that derives EVM keys and signs digests. */
export const V1_SIGNER_CONTRACT_ID = process.env.NEXT_PUBLIC_NEAR_MPC_CONTRACT_ID
  || "v1.signer";

/**
 * Derivation path prefix for the MPC-derived EVM owner address. Reusing the
 * rhea prefix keeps the same derived account (and Polymarket deposit wallet)
 * across rhea world cup and prophet for a given NEAR account.
 */
export const V1_SIGNER_EVM_DERIVATION_PATH_PREFIX = process.env.NEXT_PUBLIC_NEAR_MPC_PATH_PREFIX
  || "polymarket";

export const V1_SIGNER_DOMAIN_ID = 0;

export const ONE_YOCTO_NEAR = "1";

export const V1_SIGNER_SIGN_GAS = "200000000000000";
