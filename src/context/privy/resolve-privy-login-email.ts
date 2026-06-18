import type { LinkedAccountWithMetadata, User } from "@privy-io/react-auth";

/** Resolve the email used for Privy email or Google login. */
export function resolvePrivyLoginEmail(
  user: User | null | undefined,
  loginAccount?: LinkedAccountWithMetadata | null
): string | undefined {

  if (loginAccount?.type === "email") {
    return loginAccount.address;
  }

  if (loginAccount?.type === "google_oauth") {
    return loginAccount.email;
  }

  if (user?.email?.address) {
    return user.email.address;
  }

  if (user?.google?.email) {
    return user.google.email;
  }

  return undefined;
}
