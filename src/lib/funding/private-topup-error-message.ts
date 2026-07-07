import { isSolanaConfirmationTimeoutMessage } from "@/lib/funding/deposit-error-message";
import { getRuntimeTranslator } from "@/lib/i18n/runtime-messages";
import { resolveWalletErrorMessage } from "@/lib/trading/wallet-error-message";

export const SOLANA_CONFIRMATION_TIMEOUT_FALLBACK =
  "Transaction confirmation timed out. Your transfer may still be processing. Refresh your Private Balance later to check whether the top up completed.";

export interface PrivateTopupErrorResolution {
  message: string;
  isSolanaConfirmationTimeout: boolean;
}

export function resolvePrivateTopupErrorMessage(error: unknown): string {
  return resolvePrivateTopupError(error).message;
}

export function resolvePrivateTopupError(
  error: unknown,
): PrivateTopupErrorResolution {
  const message = resolveWalletErrorMessage(error);

  if (!isSolanaConfirmationTimeoutMessage(message)) {
    return { message, isSolanaConfirmationTimeout: false };
  }

  try {
    return {
      message: getRuntimeTranslator("privateTopup")("solanaConfirmationTimeout"),
      isSolanaConfirmationTimeout: true,
    };
  } catch {
    return {
      message: SOLANA_CONFIRMATION_TIMEOUT_FALLBACK,
      isSolanaConfirmationTimeout: true,
    };
  }
}
