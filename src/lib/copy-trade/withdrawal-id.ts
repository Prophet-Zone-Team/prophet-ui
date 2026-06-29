/** Build a unique idempotency key for a withdrawal submission. */
export function newCopyWithdrawalClientRequestId(userId: number): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `withdraw:${userId}:${crypto.randomUUID()}`;
  }

  return `withdraw:${userId}:${Date.now()}:${Math.random()
    .toString(16)
    .slice(2)}`;
}
