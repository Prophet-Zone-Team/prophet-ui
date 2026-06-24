import "server-only";

import { ELIGIBILITY_WHITELIST_EMAILS } from "@/config/eligibility-whitelist";
import {
  isChinaGeo,
  isWhitelistLoginGeoActive,
  normalizeWhitelistEmail,
} from "@/lib/trading/eligibility-whitelist";
import type { ClientGeoHeaders } from "@/server/trading/eligibility";

const WHITELIST_NOT_CONFIGURED_REASON =
  "Email whitelist login is not available.";
const WHITELIST_GEO_REQUIRED_REASON =
  "Email whitelist login is only available from supported regions.";
const WHITELIST_EMAIL_REQUIRED_REASON = "Please request whitelist access.";

let cachedWhitelistEmails: Set<string> | undefined;

function getWhitelistEmailSet(): Set<string> {
  if (cachedWhitelistEmails) {
    return cachedWhitelistEmails;
  }

  cachedWhitelistEmails = new Set(
    ELIGIBILITY_WHITELIST_EMAILS.map(normalizeWhitelistEmail).filter(Boolean),
  );

  return cachedWhitelistEmails;
}

export function isEligibilityWhitelistConfigured(): boolean {
  return getWhitelistEmailSet().size > 0;
}

export function isEmailOnEligibilityWhitelist(email: string): boolean {
  const normalized = normalizeWhitelistEmail(email);

  if (!normalized) {
    return false;
  }

  return getWhitelistEmailSet().has(normalized);
}

export function isWhitelistLoginGeo(clientGeo?: ClientGeoHeaders): boolean {
  return isWhitelistLoginGeoActive(
    clientGeo?.country,
    getWhitelistEmailSet().size,
  );
}

export type WhitelistEmailAccessResult =
  | { ok: true }
  | { ok: false; reason: string };

export function assertWhitelistEmailAccess(
  email: string,
  clientGeo?: ClientGeoHeaders,
): WhitelistEmailAccessResult {
  if (!isEligibilityWhitelistConfigured()) {
    return { ok: false, reason: WHITELIST_NOT_CONFIGURED_REASON };
  }

  if (!isChinaGeo(clientGeo?.country)) {
    return { ok: false, reason: WHITELIST_GEO_REQUIRED_REASON };
  }

  if (!isEmailOnEligibilityWhitelist(email)) {
    return { ok: false, reason: WHITELIST_EMAIL_REQUIRED_REASON };
  }

  return { ok: true };
}

export function resolveWhitelistSessionEligibility(input: {
  whitelistEmail?: string;
  clientGeo?: ClientGeoHeaders;
}): boolean {
  if (!input.whitelistEmail?.trim()) {
    return false;
  }

  return assertWhitelistEmailAccess(input.whitelistEmail, input.clientGeo).ok;
}
