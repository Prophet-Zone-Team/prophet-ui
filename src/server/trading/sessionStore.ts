import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

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
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const sessionId = randomBytes(16).toString("hex");
  const session: TradingUserSession = {
    sessionId,
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
    authenticatedAt: createdAt,
    createdAt,
    expiresAt,
  };

  store.set(getSessionStoreKey(session), {
    session,
  });

  return session;
}

export function getTradingSession(userId: string | undefined): TradingSessionRecord | undefined {
  if (!userId) {
    return undefined;
  }

  const record = store.get(userId) ?? [...store.values()].find((candidate) => candidate.session.userId === userId);

  if (!record) {
    return undefined;
  }

  if (record.session.expiresAt && Date.parse(record.session.expiresAt) <= Date.now()) {
    store.delete(getSessionStoreKey(record.session));
    return undefined;
  }

  return record;
}

export function getTradingSessionFromCookie(cookieHeader: string | null): TradingSessionRecord | undefined {
  const cookie = parseTradingSessionCookie(cookieHeader);

  if (!cookie) {
    return undefined;
  }

  const existingRecord = store.get(getSessionStoreKey(cookie.session));

  if (existingRecord) {
    if (!existingRecord.credentials) {
      const credentials = parseTradingCredentialsCookie(
        cookieHeader,
        existingRecord.session.userId,
        existingRecord.session.sessionId,
      );

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
    credentials: parseTradingCredentialsCookie(cookieHeader, cookie.userId, cookie.session.sessionId),
  };
  store.set(getSessionStoreKey(cookie.session), record);

  return record;
}

export function updateTradingSession(session: TradingUserSession): TradingUserSession {
  const existing = store.get(getSessionStoreKey(session));
  store.set(getSessionStoreKey(session), {
    session,
    credentials: existing?.credentials,
  });

  return session;
}

export function setTradingCredentials(
  userId: string,
  credentials: Omit<StoredUserTradingCredentials, "derivedAt"> & { derivedAt?: string },
  sessionId?: string,
): UserTradingCredentialStatus {
  const record = sessionId ? store.get(`${userId}:${sessionId}`) : getTradingSession(userId);

  if (!record) {
    throw new Error("Trading session not found.");
  }

  const storedCredentials = {
    ...credentials,
    derivedAt: credentials.derivedAt ?? new Date().toISOString(),
  };

  store.set(getSessionStoreKey(record.session), {
    ...record,
    credentials: storedCredentials,
  });

  return getTradingCredentialStatus(userId, record.session.sessionId);
}

export function createTradingCredentialsCookie({
  userId,
  sessionId,
  credentials,
}: {
  userId: string;
  sessionId: string;
  credentials: StoredUserTradingCredentials;
}): string {
  const payload = encryptCookiePayload({
    userId,
    sessionId,
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

export function getTradingCredentialStatus(userId: string | undefined, sessionId?: string): UserTradingCredentialStatus {
  const record = userId && sessionId ? store.get(`${userId}:${sessionId}`) : getTradingSession(userId);

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
    for (const [key, record] of store.entries()) {
      if (record.session.userId === userId) {
        store.delete(key);
      }
    }
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
    const payload = verifySignedPayload(value) as { session?: TradingUserSession };
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
  const payload = signCookiePayload({ session });

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
  expectedSessionId: string | undefined,
): StoredUserTradingCredentials | undefined {
  const value = getCookieValue(cookieHeader, CREDENTIAL_COOKIE_NAME);

  if (!value) {
    return undefined;
  }

  try {
    const payload = decryptCookiePayload(value) as { userId?: unknown; sessionId?: unknown; credentials?: unknown };

    if (
      payload.userId !== expectedUserId ||
      payload.sessionId !== expectedSessionId ||
      !isValidCredentialPayload(payload.credentials)
    ) {
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

function getCookieSigningKey() {
  return getCookieEncryptionKey();
}

function isValidSessionPayload(value: unknown): value is TradingUserSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<TradingUserSession>;

  return (
    typeof session.userId === "string" &&
    session.userId.startsWith("wallet:") &&
    typeof session.sessionId === "string" &&
    /^[a-f0-9]{32}$/.test(session.sessionId) &&
    typeof session.walletAddress === "string" &&
    /^0x[a-fA-F0-9]{40}$/.test(session.walletAddress) &&
    session.userId === `wallet:${session.walletAddress.toLowerCase()}` &&
    typeof session.signatureType === "number" &&
    typeof session.authenticatedAt === "string" &&
    typeof session.createdAt === "string"
  );
}

function getSessionStoreKey(session: TradingUserSession) {
  return `${session.userId}:${session.sessionId}`;
}

function signCookiePayload(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getCookieSigningKey()).update(body).digest("base64url");

  return `${body}.${signature}`;
}

function verifySignedPayload(value: string): unknown {
  const [body, signature] = value.split(".");

  if (!body || !signature) {
    throw new Error("Invalid signed cookie payload.");
  }

  const expected = createHmac("sha256", getCookieSigningKey()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Invalid signed cookie signature.");
  }

  return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
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
