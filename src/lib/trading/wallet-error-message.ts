export const WALLET_USER_REJECTION_MESSAGE = "User rejected the request.";

export function isUserRejectedRequest(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("code" in error && Number((error as { code?: unknown }).code) === 4001) {
    return true;
  }

  if ("cause" in error && isUserRejectedRequest((error as { cause?: unknown }).cause)) {
    return true;
  }

  return false;
}

export function resolveWalletErrorMessage(
  error: unknown,
  options?: { rejectionMessage?: string },
): string {
  const rejectionMessage = options?.rejectionMessage ?? WALLET_USER_REJECTION_MESSAGE;

  if (isUserRejectedRequest(error)) {
    return rejectionMessage;
  }

  const message = extractErrorMessage(error);

  if (isWalletRejectionMessage(message)) {
    return rejectionMessage;
  }

  return message;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return normalizeMessage(error.message);
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const value = error as {
      message?: unknown;
      shortMessage?: unknown;
      details?: unknown;
    };

    if (typeof value.message === "string") {
      return normalizeMessage(value.message);
    }

    if (typeof value.shortMessage === "string") {
      return normalizeMessage(value.shortMessage);
    }

    if (typeof value.details === "string") {
      return value.details;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown wallet error.";
    }
  }

  return String(error);
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();

  if (!trimmed || trimmed === "[object Object]") {
    return "Unknown wallet error.";
  }

  return trimmed;
}

function isWalletRejectionMessage(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("rejected the request") ||
    normalized.includes("request rejected") ||
    normalized.includes("action_rejected") ||
    normalized.includes("signature was rejected")
  );
}
