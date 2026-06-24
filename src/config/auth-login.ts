/** Email-only login UI when CN geo + whitelist is active (server-driven). */
export function resolveEmailOnlyLoginEnabled(
  whitelistLoginMode?: boolean
): boolean {
  return Boolean(whitelistLoginMode);
}
