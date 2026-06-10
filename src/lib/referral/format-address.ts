export function formatShortAddress(address: string): string {
  const trimmed = address.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= 12) {
    return trimmed;
  }

  const prefix = trimmed.startsWith("0x") ? trimmed.slice(0, 5) : trimmed.slice(0, 4);
  const suffix = trimmed.slice(-5);

  return `${prefix}...${suffix}`;
}
