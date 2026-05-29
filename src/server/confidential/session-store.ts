import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

import { MAIN_DOMAIN } from "@/config/funding";
import { deriveIntentsUserId, normalizeEvmAddress } from "@/server/confidential/identity";

export interface ConfidentialSessionRecord {
  walletAddress: string;
  intentsUserId: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

const CONFIDENTIAL_SESSION_COOKIE_NAME = "wc_confidential_session";
const DEFAULT_ACCESS_TTL_MS = 1000 * 60 * 15;
const DEFAULT_REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

const memoryStore = new Map<string, ConfidentialSessionRecord>();

export function getConfidentialSessionCookieName() {
  return CONFIDENTIAL_SESSION_COOKIE_NAME;
}

export function saveConfidentialSession(record: ConfidentialSessionRecord) {
  memoryStore.set(record.walletAddress.toLowerCase(), record);
}

export function getConfidentialSessionFromMemory(
  walletAddress: string,
): ConfidentialSessionRecord | undefined {
  return memoryStore.get(walletAddress.toLowerCase());
}

export function getConfidentialSessionFromCookie(
  cookieHeader: string | null,
): ConfidentialSessionRecord | undefined {
  const parsed = parseConfidentialSessionCookie(cookieHeader);

  if (!parsed) {
    return undefined;
  }

  if (Date.parse(parsed.accessExpiresAt) <= Date.now()) {
    return undefined;
  }

  const cached = memoryStore.get(parsed.walletAddress.toLowerCase());

  if (cached && cached.accessToken === parsed.accessToken) {
    return cached;
  }

  memoryStore.set(parsed.walletAddress.toLowerCase(), parsed);
  return parsed;
}

export function clearConfidentialSession(walletAddress: string) {
  memoryStore.delete(walletAddress.toLowerCase());
}

export function createConfidentialSessionCookie(record: ConfidentialSessionRecord): string {
  const maxAge = Math.max(
    0,
    Math.floor((Date.parse(record.refreshExpiresAt ?? record.accessExpiresAt) - Date.now()) / 1000),
  );
  const payload = signCookiePayload({ session: record });
  const parts = [
    `${CONFIDENTIAL_SESSION_COOKIE_NAME}=${encodeURIComponent(payload)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  if (MAIN_DOMAIN) {
    parts.push(`Domain=.${MAIN_DOMAIN}`);
  }

  return parts.join("; ");
}

export function clearConfidentialSessionCookie(): string {
  const parts = [
    `${CONFIDENTIAL_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  if (MAIN_DOMAIN) {
    parts.push(`Domain=.${MAIN_DOMAIN}`);
  }

  return parts.join("; ");
}

export function buildConfidentialSessionRecord({
  walletAddress,
  accessToken,
  refreshToken,
  expiresIn,
  refreshExpiresIn,
}: {
  walletAddress: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn?: number;
}): ConfidentialSessionRecord {
  const normalizedWallet = normalizeEvmAddress(walletAddress);
  const now = new Date();

  return {
    walletAddress: normalizedWallet,
    intentsUserId: deriveIntentsUserId(normalizedWallet),
    accessToken,
    refreshToken,
    accessExpiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
    refreshExpiresAt: new Date(
      now.getTime() + (refreshExpiresIn ?? DEFAULT_REFRESH_TTL_MS / 1000) * 1000,
    ).toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function getDefaultAccessTtlMs() {
  return DEFAULT_ACCESS_TTL_MS;
}

function parseConfidentialSessionCookie(
  cookieHeader: string | null,
): ConfidentialSessionRecord | undefined {
  const value = getCookieValue(cookieHeader, CONFIDENTIAL_SESSION_COOKIE_NAME);

  if (!value) {
    return undefined;
  }

  try {
    const payload = verifySignedPayload(value) as { session?: ConfidentialSessionRecord };
    const session = payload.session;

    if (!isValidConfidentialSession(session)) {
      return undefined;
    }

    return session;
  } catch {
    return undefined;
  }
}

function isValidConfidentialSession(
  value: ConfidentialSessionRecord | undefined,
): value is ConfidentialSessionRecord {
  if (!value) {
    return false;
  }

  return (
    EVM_ADDRESS_PATTERN.test(value.walletAddress) &&
    typeof value.intentsUserId === "string" &&
    value.intentsUserId.length > 0 &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === "string" &&
    value.refreshToken.length > 0 &&
    typeof value.accessExpiresAt === "string"
  );
}

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function getCookieEncryptionKey() {
  const secret =
    process.env.TRADING_SESSION_SECRET?.trim() ??
    process.env.AUTH_SECRET?.trim() ??
    process.env.NEXTAUTH_SECRET?.trim() ??
    process.env.POLYMARKET_BUILDER_SECRET?.trim();

  if (!secret) {
    throw new Error("TRADING_SESSION_SECRET is required for confidential sessions.");
  }

  return createHash("sha256").update(secret).digest();
}

function signCookiePayload(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getCookieEncryptionKey()).update(body).digest("base64url");

  return `${body}.${signature}`;
}

function verifySignedPayload(value: string): unknown {
  const [body, signature] = value.split(".");

  if (!body || !signature) {
    throw new Error("Invalid signed cookie payload.");
  }

  const expected = createHmac("sha256", getCookieEncryptionKey()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Invalid signed cookie signature.");
  }

  return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
}

function encryptCookiePayload(payload: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getCookieEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
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

  return JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"));
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
