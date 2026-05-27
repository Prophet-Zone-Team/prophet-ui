export function normalizeMarketTokenIds(
  tokenIds: Array<string | undefined>
): string[] {
  const unique = new Set<string>();

  for (const tokenId of tokenIds) {
    if (tokenId) {
      unique.add(tokenId);
    }
  }

  return [...unique].sort();
}

export function buildMarketTokenKey(
  tokenIds: Array<string | undefined>
): string {
  return normalizeMarketTokenIds(tokenIds).join("|");
}
