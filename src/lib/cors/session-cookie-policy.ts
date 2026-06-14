import { isAllowedCorsOrigin } from "@/lib/cors/allowed-origins";

export interface SessionCookiePolicy {
  sameSite: "Lax" | "None";
  secure: boolean;
}

const DEFAULT_SESSION_COOKIE_POLICY: SessionCookiePolicy = {
  sameSite: "Lax",
  secure: false,
};

const CROSS_SITE_SESSION_COOKIE_POLICY: SessionCookiePolicy = {
  sameSite: "None",
  secure: true,
};

export function resolveSessionCookiePolicy(request: Request): SessionCookiePolicy {
  const origin = request.headers.get("origin");

  if (!origin || !isAllowedCorsOrigin(origin)) {
    return DEFAULT_SESSION_COOKIE_POLICY;
  }

  let originHost: string;

  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return DEFAULT_SESSION_COOKIE_POLICY;
  }

  const requestHost = (request.headers.get("host") ?? new URL(request.url).host).toLowerCase();

  if (originHost !== requestHost) {
    return CROSS_SITE_SESSION_COOKIE_POLICY;
  }

  return DEFAULT_SESSION_COOKIE_POLICY;
}

export function appendSessionCookieAttributes(
  parts: string[],
  policy?: SessionCookiePolicy,
): string[] {
  const resolved = policy ?? DEFAULT_SESSION_COOKIE_POLICY;
  const nextParts = [...parts, `SameSite=${resolved.sameSite}`];

  if (resolved.secure || resolved.sameSite === "None") {
    nextParts.push("Secure");
  }

  return nextParts;
}
