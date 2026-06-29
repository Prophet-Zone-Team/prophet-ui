import {
  FundingNetworkType,
  getFundingNetworkByChainId,
  type FundingAsset,
} from "@/config/funding";
import type { ChainType } from "@/lib/wallet/types";
import { getTokenLogo } from "@/utils/logo";
import type {
  CopyBridgeSupportedAsset,
  CopyDepositAddress,
} from "@/types/copy-trade-funding";

export interface CopyDepositChainOption {
  chainId: number;
  chainName: string;
  chainIcon: string;
  chainType: FundingNetworkType;
}

/**
 * Adapt a copy-trade bridge supported asset to the shared FundingAsset shape so
 * we can reuse the EVM balance hook, balance selectors and token transfer
 * primitive without re-implementing chain metadata.
 */
export function copyAssetToFundingAsset(
  asset: CopyBridgeSupportedAsset,
): FundingAsset | null {
  const chainId = Number(asset.chainId);
  if (!Number.isFinite(chainId)) {
    return null;
  }

  const network = getFundingNetworkByChainId(chainId);
  if (!network) {
    return null;
  }

  return {
    ...network,
    symbol: asset.tokenSymbol,
    address: asset.tokenAddress,
    decimals: asset.decimals,
    icon: getTokenLogo(asset.tokenSymbol),
    minCheckoutUsd: asset.minCheckoutUsd,
    name: asset.tokenName,
  };
}

/** Map every supported asset that resolves to a known funding network. */
export function copyAssetsToFundingAssets(
  assets: CopyBridgeSupportedAsset[],
): FundingAsset[] {
  return assets
    .map((asset) => copyAssetToFundingAsset(asset))
    .filter((asset): asset is FundingAsset => asset !== null);
}

export function fundingNetworkTypeToWalletChainType(
  networkType: FundingNetworkType,
): ChainType | null {
  switch (networkType) {
    case FundingNetworkType.EVM:
      return "evm";
    case FundingNetworkType.SVM:
      return "solana";
    case FundingNetworkType.TVM:
      return "tron";
    default:
      return null;
  }
}

/**
 * Tokens that can be deposited from the connected wallet via a direct on-chain
 * transfer. The connected wallet in copy-trade is an EVM wallet, so only EVM
 * assets are transferable; non-EVM supported assets are shown via the manual
 * address/QR path only.
 */
export function getConnectedDepositAssets(
  assets: FundingAsset[],
): FundingAsset[] {
  return assets.filter(
    (asset) => asset.chainType === FundingNetworkType.EVM,
  );
}

export function getCopyDepositChainOptions(
  assets: FundingAsset[],
): CopyDepositChainOption[] {
  const seen = new Map<number, CopyDepositChainOption>();

  for (const asset of assets) {
    if (seen.has(asset.chainId)) {
      continue;
    }

    seen.set(asset.chainId, {
      chainId: asset.chainId,
      chainName: asset.chainName,
      chainIcon: asset.chainIcon,
      chainType: asset.chainType,
    });
  }

  return Array.from(seen.values());
}

export function getCopyDepositTokensForChain(
  assets: FundingAsset[],
  chainId: number,
): FundingAsset[] {
  return assets.filter((asset) => asset.chainId === chainId);
}

/** Resolve which bridge deposit address to use for a given wallet chain type. */
export function resolveCopyDepositAddress(
  address: CopyDepositAddress | null | undefined,
  chainType: FundingNetworkType,
): string {
  if (!address) {
    return "";
  }

  switch (chainType) {
    case FundingNetworkType.SVM:
      return address.svm_deposit_address;
    case FundingNetworkType.TVM:
      return address.tron_deposit_address;
    case FundingNetworkType.BTC:
      return address.btc_deposit_address;
    default:
      return address.evm_deposit_address;
  }
}
