import { FUNDING_NETWORKS } from "@/config/funding/networks";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const NEAR_ACCOUNT_PATTERN = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/i;
const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const SOLANA_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const TRON_CHAIN_ID = String(FUNDING_NETWORKS.tron.chainId);
const SOLANA_CHAIN_ID = String(FUNDING_NETWORKS.solana.chainId);
const NATIVE_TOKEN_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isValidEvmAddress(address: string): boolean {
  return EVM_ADDRESS_PATTERN.test(address.trim());
}

export function isValidNearAccountId(address: string): boolean {
  const normalized = address.trim();

  if (!normalized || normalized.length > 64) {
    return false;
  }

  return NEAR_ACCOUNT_PATTERN.test(normalized);
}

export function isValidTronAddress(address: string): boolean {
  return TRON_ADDRESS_PATTERN.test(address.trim());
}

export function isValidSolanaAddress(address: string): boolean {
  return SOLANA_ADDRESS_PATTERN.test(address.trim());
}

export function isNativeBridgeTokenAddress(address: string): boolean {
  return address.trim().toLowerCase() === NATIVE_TOKEN_SENTINEL;
}

export function isValidBridgeTokenAddress(chainId: string, address: string): boolean {
  const normalized = address.trim();

  if (!normalized) {
    return false;
  }

  if (isNativeBridgeTokenAddress(normalized)) {
    return true;
  }

  const normalizedChainId = chainId.trim();

  if (normalizedChainId === TRON_CHAIN_ID) {
    return isValidTronAddress(normalized);
  }

  if (normalizedChainId === SOLANA_CHAIN_ID) {
    return isValidSolanaAddress(normalized);
  }

  return isValidEvmAddress(normalized);
}

export function isValidBridgeRecipientAddress(chainId: string, address: string): boolean {
  return isValidBridgeTokenAddress(chainId, address);
}

export function isValidStableflowRefundAddress(
  blockchain: string,
  address: string,
): boolean {
  const normalized = address.trim();

  if (!normalized) {
    return false;
  }

  switch (blockchain) {
    case "near":
      return isValidNearAccountId(normalized);
    case "tron":
      return isValidTronAddress(normalized);
    case "sol":
      return isValidSolanaAddress(normalized);
    default:
      return isValidEvmAddress(normalized);
  }
}

export function isValidStableflowRecipientAddress(
  blockchain: string,
  address: string,
): boolean {
  return isValidStableflowRefundAddress(blockchain, address);
}

export function isValidStableflowDepositTxHash(txHash: string): boolean {
  const normalized = txHash.trim();

  if (!normalized) {
    return false;
  }

  if (/^0x[a-fA-F0-9]+$/.test(normalized)) {
    return true;
  }

  return /^[A-Za-z0-9]{40,88}$/.test(normalized);
}

export function getRecipientPlaceholder(blockchain: string): string {
  switch (blockchain) {
    case "near":
      return "user.near";
    case "tron":
      return "T…";
    case "sol":
      return "Solana address";
    default:
      return "0x…";
  }
}
