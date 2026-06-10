const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLocalhostHostname(hostname: string): boolean {
  return LOCALHOST_HOSTNAMES.has(hostname.toLowerCase());
}

export function isSecureFromHeaders(headers: Headers): boolean {
  const proto = headers.get("x-forwarded-proto");

  if (proto === "http") {
    return false;
  }

  return true;
}

export function isSecureInBrowser(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function getHttpsUpgradeUrl(): string {
  if (typeof window === "undefined") {
    return "https://";
  }

  return window.location.href.replace(/^http:/i, "https:");
}
