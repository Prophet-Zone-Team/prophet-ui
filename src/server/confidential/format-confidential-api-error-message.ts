import { formatUnits } from "viem";

const TRY_AT_LEAST_BASE_UNITS_PATTERN = /^(.*try at least )(\d+)$/i;

export function formatConfidentialApiErrorMessage(message: string, decimals = 6): string {
  const match = message.match(TRY_AT_LEAST_BASE_UNITS_PATTERN);

  if (!match) {
    return message;
  }

  const [, prefix, baseUnits] = match;

  try {
    return `${prefix}${formatUnits(BigInt(baseUnits), decimals)}`;
  } catch {
    return message;
  }
}
