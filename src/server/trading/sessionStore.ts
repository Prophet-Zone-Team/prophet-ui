import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

import type { TradingUserSession, UserTradingCredentialStatus } from "../../types/market";

export interface StoredUserTradingCredentials {
  key: string;
  secret: string;
  passphrase: string;
  derivedAt: string;
}

export interface TradingSessionRecord {
  session: TradingUserSession;
  credentials?: StoredUserTradingCredentials;
}

const SESSION_COOKIE_NAME = "wc_trading_session";
const CREDENTIAL_COOKIE_NAME = "wc_trading_credentials";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const CREDENTIAL_COOKIE_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const store = new Map<string, TradingSessionRecord>();

export function createTradingSession({
  walletAddress,
  funderAddress,
  depositWalletStatus,
  depositWalletCheckedAt,
  depositWalletTransactionId,
  depositWalletTransactionHash,
  depositWalletError,
  signatureType,
  eligibilityStatus,
  eligibilityCheckedAt,
  eligibilityCountry,
  eligibilityRegion,
  eligibilityReason,
}: {
  walletAddress: string;
  funderAddress?: string;
  depositWalletStatus?: TradingUserSession["depositWalletStatus"];
  depositWalletCheckedAt?: string;
  depositWalletTransactionId?: string;
  depositWalletTransactionHash?: string;
  depositWalletError?: string;
  signatureType: number;
  eligibilityStatus?: TradingUserSession["eligibilityStatus"];
  eligibilityCheckedAt?: string;
  eligibilityCountry?: string;
  eligibilityRegion?: string;
  eligibilityReason?: string;
}): TradingUserSession {
  const normalizedWallet = normalizeAddress(walletAddress);
  const existingRecord = store.get(`wallet:${normalizedWallet.toLowerCase()}`);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const session: TradingUserSession = {
    userId: `wallet:${normalizedWallet.toLowerCase()}`,
    walletAddress: normalizedWallet,
    funderAddress: funderAddress ? normalizeAddress(funderAddress) : undefined,
    depositWalletStatus,
    depositWalletCheckedAt,
    depositWalletTransactionId,
    depositWalletTransactionHash,
    depositWalletError,
    signatureType,
    eligibilityStatus: eligibilityStatus ?? "unknown",
    eligibilityCheckedAt,
    eligibilityCountry,
    eligibilityRegion,
    eligibilityReason,
    createdAt,
    expiresAt,
  };

  store.set(session.userId, {
    session,
    credentials: existingRecord?.credentials,
  });

  return session;
}

export function getTradingSession(userId: string | undefined): TradingSessionRecord | undefined {
  if (!userId) {
    return undefined;
  }

  const record = store.get(userId);

  if (!record) {
    return undefined;
  }

  if (record.session.expiresAt && Date.parse(record.session.expiresAt) <= Date.now()) {
    store.delete(userId);
    return undefined;
  }

  return record;
}

export function getTradingSessionFromCookie(cookieHeader: string | null): TradingSessionRecord | undefined {
  const cookie = parseTradingSessionCookie(cookieHeader);

  if (!cookie) {
    return undefined;
  }

  const existingRecord = getTradingSession(cookie.userId);

  if (existingRecord) {
    if (!existingRecord.credentials) {
      const credentials = parseTradingCredentialsCookie(cookieHeader, existingRecord.session.userId);

      if (credentials) {
        existingRecord.credentials = credentials;
      }
    }

    return existingRecord;
  }

  if (cookie.session.expiresAt && Date.parse(cookie.session.expiresAt) <= Date.now()) {
    return undefined;
  }

  const record = {
    session: cookie.session,
    credentials: parseTradingCredentialsCookie(cookieHeader, cookie.userId),
  };
  store.set(cookie.userId, record);

  return record;
}

export function updateTradingSession(session: TradingUserSession): TradingUserSession {
  const existing = store.get(session.userId);
  store.set(session.userId, {
    session,
    credentials: existing?.credentials,
  });

  return session;
}

export function setTradingCredentials(
  userId: string,
  credentials: Omit<StoredUserTradingCredentials, "derivedAt"> & { derivedAt?: string },
): UserTradingCredentialStatus {
  const record = getTradingSession(userId);

  if (!record) {
    throw new Error("Trading session not found.");
  }

  const storedCredentials = {
    ...credentials,
    derivedAt: credentials.derivedAt ?? new Date().toISOString(),
  };

  store.set(userId, {
    ...record,
    credentials: storedCredentials,
  });

  return getTradingCredentialStatus(userId);
}

export function createTradingCredentialsCookie({
  userId,
  credentials,
}: {
  userId: string;
  credentials: StoredUserTradingCredentials;
}): string {
  const payload = encryptCookiePayload({
    userId,
    credentials,
  });

  return [
    `${CREDENTIAL_COOKIE_NAME}=${encodeURIComponent(payload)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${CREDENTIAL_COOKIE_MAX_AGE}`,
  ].join("; ");
}

export function getTradingCredentialStatus(userId: string | undefined): UserTradingCredentialStatus {
  const record = getTradingSession(userId);

  if (!record?.credentials) {
    return {
      hasClobCredentials: false,
      storage: "none",
    };
  }

  return {
    hasClobCredentials: true,
    derivedAt: record.credentials.derivedAt,
    storage: "session",
  };
}

export function clearTradingSession(userId: string | undefined) {
  if (userId) {
    store.delete(userId);
  }
}

export function parseTradingSessionCookie(
  cookieHeader: string | null,
): { userId: string; session: TradingUserSession } | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!cookie) {
    return undefined;
  }

  try {
    const value = decodeURIComponent(cookie.slice(`${SESSION_COOKIE_NAME}=`.length));
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { session?: TradingUserSession };
    const session = payload.session;

    if (!isValidSessionPayload(session)) {
      return undefined;
    }

    return {
      userId: session.userId,
      session,
    };
  } catch {
    return undefined;
  }
}

export function createTradingSessionCookie(session: TradingUserSession): string {
  const maxAge = Math.max(0, Math.floor((Date.parse(session.expiresAt ?? session.createdAt) - Date.now()) / 1000));
  const payload = Buffer.from(JSON.stringify({ session }), "utf8").toString("base64url");

  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(payload)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

export function clearTradingSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function clearTradingCredentialsCookie(): string {
  return `${CREDENTIAL_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function parseTradingCredentialsCookie(
  cookieHeader: string | null,
  expectedUserId: string,
): StoredUserTradingCredentials | undefined {
  const value = getCookieValue(cookieHeader, CREDENTIAL_COOKIE_NAME);

  if (!value) {
    return undefined;
  }

  try {
    const payload = decryptCookiePayload(value) as { userId?: unknown; credentials?: unknown };

    if (payload.userId !== expectedUserId || !isValidCredentialPayload(payload.credentials)) {
      return undefined;
    }

    return payload.credentials;
  } catch {
    return undefined;
  }
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

function getCookieEncryptionKey() {
  const secret =
    process.env.TRADING_SESSION_SECRET?.trim() ??
    process.env.AUTH_SECRET?.trim() ??
    process.env.NEXTAUTH_SECRET?.trim() ??
    process.env.POLYMARKET_BUILDER_SECRET?.trim();

  if (!secret) {
    throw new Error("TRADING_SESSION_SECRET is required to store user trading credentials.");
  }

  return createHash("sha256").update(secret).digest();
}

function isValidSessionPayload(value: unknown): value is TradingUserSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<TradingUserSession>;

  return (
    typeof session.userId === "string" &&
    session.userId.startsWith("wallet:") &&
    typeof session.walletAddress === "string" &&
    /^0x[a-fA-F0-9]{40}$/.test(session.walletAddress) &&
    typeof session.signatureType === "number" &&
    typeof session.createdAt === "string"
  );
}

function isValidCredentialPayload(value: unknown): value is StoredUserTradingCredentials {
  if (!value || typeof value !== "object") {
    return false;
  }

  const credentials = value as Partial<StoredUserTradingCredentials>;

  return (
    typeof credentials.key === "string" &&
    credentials.key.length > 0 &&
    typeof credentials.secret === "string" &&
    credentials.secret.length > 0 &&
    typeof credentials.passphrase === "string" &&
    credentials.passphrase.length > 0 &&
    typeof credentials.derivedAt === "string"
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

function normalizeAddress(address: string): string {
  const value = address.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("Invalid wallet address.");
  }

  return value;
}
