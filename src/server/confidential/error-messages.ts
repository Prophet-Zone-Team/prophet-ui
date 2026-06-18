import "server-only";

import { getConfidentialTokens } from "@/server/confidential/one-click-client";

export { formatConfidentialApiErrorMessage } from "@/server/confidential/format-confidential-api-error-message";

const DEFAULT_ORIGIN_TOKEN_DECIMALS = 6;

export async function resolveOriginTokenDecimals(originAssetId: string): Promise<number> {
  const tokens = await getConfidentialTokens();
  const match = tokens.find((token) => token.assetId === originAssetId);

  return match?.decimals ?? DEFAULT_ORIGIN_TOKEN_DECIMALS;
}
