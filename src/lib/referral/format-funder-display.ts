export function formatReferralFunderDisplay(address?: string): string | null {
  if (!address) {
    return null;
  }

  const normalized = address.trim();
  if (normalized.length <= 12) {
    return normalized;
  }

  if (normalized.startsWith("0x") && normalized.length > 10) {
    return `${normalized.slice(0, 5)}...${normalized.slice(-5)}`;
  }

  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}
