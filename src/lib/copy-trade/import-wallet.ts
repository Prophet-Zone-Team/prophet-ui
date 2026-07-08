import { isValidEvmAddress } from "@/lib/funding/recipient-validation";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function validateImportWalletAddress(
  input: string
): { ok: true; wallet: string } | { ok: false; error: string } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, error: "Wallet must be a valid EVM address." };
  }

  if (!isValidEvmAddress(trimmed)) {
    return { ok: false, error: "Wallet must be a valid EVM address." };
  }

  const normalized = trimmed.toLowerCase();

  if (normalized === ZERO_ADDRESS) {
    return { ok: false, error: "Wallet must be a valid EVM address." };
  }

  return { ok: true, wallet: normalized };
}

export function isCatalogWalletAlreadyExistsError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("already exists") && message.includes("public catalog")
  );
}
