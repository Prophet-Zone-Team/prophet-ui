import { getRuntimeTranslator } from "@/lib/i18n/runtime-messages";
import { resolveWalletErrorMessage } from "@/lib/trading/wallet-error-message";

export const SOLANA_CONFIRMATION_TIMEOUT_FALLBACK =
  "Transaction confirmation timed out. Your transfer may still be processing. Open Portfolio later and tap Confirm pending deposit to finish funding your account.";

export function isSolanaConfirmationTimeoutMessage(message: string): boolean {
  const normalized = message.toLowerCase();

  return normalized.includes("not confirmed") && normalized.includes("seconds");
}

export function resolveDepositErrorMessage(error: unknown): string {
  const message = resolveWalletErrorMessage(error);

  if (!isSolanaConfirmationTimeoutMessage(message)) {
    return message;
  }

  try {
    return getRuntimeTranslator("portfolio")("deposit.solanaConfirmationTimeout");
  } catch {
    return SOLANA_CONFIRMATION_TIMEOUT_FALLBACK;
  }
}
