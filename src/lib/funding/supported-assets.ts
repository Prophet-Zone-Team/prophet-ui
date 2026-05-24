import { FUNDING_TOKENS_LIST, type FundingAsset } from "@/config/funding";
import { fetchJson } from "@/lib/team/client-fetch";
import type { SupportedAssetsPayload } from "@/types/funding";

export function resolveSupportedFundingAssets(payload: SupportedAssetsPayload): FundingAsset[] {
  return FUNDING_TOKENS_LIST.map((token) => {
    const match = payload.supportedAssets.find(
      (asset) =>
        token.address.toLowerCase() === asset.token.address.toLowerCase() &&
        token.chainId.toString() === asset.chainId,
    );

    if (!match) {
      return null;
    }

    return {
      ...token,
      minCheckoutUsd: match.minCheckoutUsd,
      name: match.token.name,
    };
  }).filter((token): token is FundingAsset => token !== null);
}

export async function fetchSupportedFundingAssets(): Promise<FundingAsset[]> {
  const payload = await fetchJson<SupportedAssetsPayload>("/api/trading/bridge/supported-assets");
  return resolveSupportedFundingAssets(payload);
}

export interface SupportedChainOption {
  chainId: number;
  chainName: string;
  chainIcon: string;
}

export function getUniqueChainsFromAssets(assets: FundingAsset[]): SupportedChainOption[] {
  const seen = new Map<number, SupportedChainOption>();

  for (const asset of assets) {
    if (!seen.has(asset.chainId)) {
      seen.set(asset.chainId, {
        chainId: asset.chainId,
        chainName: asset.chainName,
        chainIcon: asset.chainIcon,
      });
    }
  }

  return Array.from(seen.values());
}

export function groupSupportedAssetsByChain(assets: FundingAsset[]): Map<number, FundingAsset[]> {
  const grouped = new Map<number, FundingAsset[]>();

  for (const asset of assets) {
    const existing = grouped.get(asset.chainId) ?? [];
    existing.push(asset);
    grouped.set(asset.chainId, existing);
  }

  return grouped;
}

export function getDefaultTokenForChain(
  assets: FundingAsset[],
  chainId: number,
): FundingAsset | undefined {
  const defaultToken = assets.find((asset) => asset.chainId === chainId && asset.symbol === "USDC");
  return defaultToken ?? assets.find((asset) => asset.chainId === chainId);
}

export function getTokensForChain(assets: FundingAsset[], chainId: number): FundingAsset[] {
  return assets.filter((asset) => asset.chainId === chainId);
}
