import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

import { MAIN_DOMAIN } from "@/config/funding";

import { verifyAccessTokenIdentity } from "./auth";
import { refreshOneClickToken } from "./one-click-client";

export const CONFIDENTIAL_SESSION_COOKIE_NAME = "pc_confidential_session";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const ACCESS_TOKEN_REFRESH_SKEW_MS = 30_000;

export interface ConfidentialSession {
  eoaAddress: string;
  authMethod: "evm";
  intentsUserId: string;
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt?: string;
  createdAt: string;
}

export function createConfidentialSessionCookie(
  session: ConfidentialSession,
  host: string | null,
): string {
  const payload = encryptCookiePayload(session);
  const domain = computeCookieDomain(host);

  const parts = [
    `${CONFIDENTIAL_SESSION_COOKIE_NAME}=${encodeURIComponent(payload)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];

  if (domain) {
    parts.push(`Domain=${domain}`);
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function clearConfidentialSessionCookie(host: string | null): string {
  const domain = computeCookieDomain(host);
  const parts = [
    `${CONFIDENTIAL_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (domain) {
    parts.push(`Domain=${domain}`);
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function getConfidentialSessionFromCookie(
  cookieHeader: string | null,
): ConfidentialSession | undefined {
  const value = getCookieValue(cookieHeader, CONFIDENTIAL_SESSION_COOKIE_NAME);

  if (!value) {
    return undefined;
  }

  try {
    const payload = decryptCookiePayload(value);

    if (!isValidSession(payload)) {
      return undefined;
    }

    return payload;
  } catch {
    return undefined;
  }
}

export interface ValidAccessTokenResult {
  accessToken: string;
  session: ConfidentialSession;
  refreshed: boolean;
}

/**
 * Returns a non-expired access token, transparently refreshing it when needed.
 * Callers should persist `session` to the cookie when `refreshed` is true.
 */
export async function getValidAccessToken(
  session: ConfidentialSession,
): Promise<ValidAccessTokenResult> {
  const accessExpiresAt = Date.parse(session.accessExpiresAt);
  const now = Date.now();

  if (
    Number.isFinite(accessExpiresAt) &&
    accessExpiresAt - now > ACCESS_TOKEN_REFRESH_SKEW_MS
  ) {
    return { accessToken: session.accessToken, session, refreshed: false };
  }

  const refreshed = await refreshOneClickToken(session.refreshToken);
  const identity = await verifyAccessTokenIdentity(
    refreshed.accessToken,
    session.intentsUserId,
  );

  if (!identity) {
    throw new Error("Refreshed Confidential session does not match the wallet.");
  }

  const updatedSession: ConfidentialSession = {
    ...session,
    accessToken: refreshed.accessToken,
    accessExpiresAt: new Date(now + refreshed.expiresIn * 1000).toISOString(),
    refreshToken: refreshed.refreshToken ?? session.refreshToken,
    refreshExpiresAt: refreshed.refreshExpiresIn
      ? new Date(now + refreshed.refreshExpiresIn * 1000).toISOString()
      : session.refreshExpiresAt,
  };

  return { accessToken: updatedSession.accessToken, session: updatedSession, refreshed: true };
}

export function computeCookieDomain(host: string | null): string | undefined {
  if (!host) {
    return undefined;
  }

  const hostname = host.split(":")[0]?.trim().toLowerCase();

  if (
    !hostname ||
    hostname === "localhost" ||
    /^[0-9.]+$/.test(hostname) ||
    !hostname.includes(".")
  ) {
    return undefined;
  }

  if (hostname === MAIN_DOMAIN || hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    return `.${MAIN_DOMAIN}`;
  }

  const parts = hostname.split(".");
  return `.${parts.slice(-2).join(".")}`;
}

function encryptCookiePayload(payload: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getCookieEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
}

function decryptCookiePayload(value: string): unknown {
  const payload = Buffer.from(value, "base64url");

  if (payload.length <= 28) {
    throw new Error("Invalid encrypted cookie payload.");
  }

  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, getCookieEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  return JSON.parse(
    Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"),
  );
}

function getCookieEncryptionKey() {
  const secret =
    process.env.CONFIDENTIAL_SESSION_SECRET?.trim() ??
    process.env.TRADING_SESSION_SECRET?.trim() ??
    process.env.AUTH_SECRET?.trim() ??
    process.env.NEXTAUTH_SECRET?.trim() ??
    process.env.POLYMARKET_BUILDER_SECRET?.trim();

  if (!secret) {
    throw new Error("CONFIDENTIAL_SESSION_SECRET is required to store Confidential sessions.");
  }

  return createHash("sha256").update(secret).digest();
}

function isValidSession(value: unknown): value is ConfidentialSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<ConfidentialSession>;

  return (
    typeof session.eoaAddress === "string" &&
    /^0x[a-f0-9]{40}$/.test(session.eoaAddress) &&
    session.authMethod === "evm" &&
    typeof session.intentsUserId === "string" &&
    session.intentsUserId.length > 0 &&
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.accessExpiresAt === "string" &&
    typeof session.refreshToken === "string" &&
    session.refreshToken.length > 0 &&
    typeof session.createdAt === "string"
  );
}

function getCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return undefined;
  }

  return decodeURIComponent(cookie.slice(`${name}=`.length));
}
