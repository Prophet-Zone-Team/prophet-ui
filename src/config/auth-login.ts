import { IS_PRODUCTION } from "@/config/funding";

/** Packaged production builds expose email-only wallet connection (all viewports). */
export const isPackagedAppEmailOnlyLogin = IS_PRODUCTION;

export function resolveEmailOnlyLoginEnabled(
  whitelistLoginMode?: boolean,
): boolean {
  return Boolean(whitelistLoginMode) || isPackagedAppEmailOnlyLogin;
}
