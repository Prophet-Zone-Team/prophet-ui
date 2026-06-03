export const OAUTH_PENDING_STORAGE_KEY = "prophet_oauth_pending";

export function getOAuthReturnProvider() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (
    new URLSearchParams(window.location.search).get("privy_oauth_provider") ??
    undefined
  );
}

export function hasOAuthReturnParams() {
  if (typeof window === "undefined") {
    return false;
  }

  return [...new URLSearchParams(window.location.search).keys()].some((key) =>
    key.startsWith("privy_oauth_"),
  );
}

export function clearOAuthUrlParams() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  let changed = false;

  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("privy_oauth_")) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

export function markOAuthPending(provider: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(OAUTH_PENDING_STORAGE_KEY, provider);
}

export function consumeOAuthPending() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const pending = window.localStorage.getItem(OAUTH_PENDING_STORAGE_KEY);
  window.localStorage.removeItem(OAUTH_PENDING_STORAGE_KEY);
  return pending ?? undefined;
}
