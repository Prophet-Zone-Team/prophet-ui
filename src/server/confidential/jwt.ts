import "server-only";

import { getOneClickConfig } from "@/server/confidential/config";
import { deriveIntentsUserId } from "@/server/confidential/identity";

export interface VerifiedAccessToken {
  account_id: string;
  exp: number;
}

export async function verifyAccessTokenIdentity(
  accessToken: string,
  walletAddress: string,
): Promise<VerifiedAccessToken | null> {
  const expectedAccountId = deriveIntentsUserId(walletAddress);
  const payload = await decodeAccessToken(accessToken);

  if (!payload?.account_id || !payload.exp) {
    return null;
  }

  if (payload.account_id !== expectedAccountId) {
    return null;
  }

  if (payload.exp * 1000 <= Date.now()) {
    return null;
  }

  return payload;
}

async function decodeAccessToken(accessToken: string): Promise<VerifiedAccessToken | null> {
  const config = getOneClickConfig();

  if (config.jwtPublicKey) {
    try {
      const { createLocalJWKSet, jwtVerify } = await import("jose");
      const jwks = createLocalJWKSet(JSON.parse(config.jwtPublicKey));
      const { payload } = await jwtVerify(accessToken, jwks, {
        ...(config.jwtIssuer ? { issuer: config.jwtIssuer } : {}),
      });

      const accountId =
        typeof payload.account_id === "string"
          ? payload.account_id
          : typeof payload.sub === "string"
            ? payload.sub
            : null;

      if (!accountId || typeof payload.exp !== "number") {
        return null;
      }

      return { account_id: accountId, exp: payload.exp };
    } catch {
      return null;
    }
  }

  try {
    const parts = accessToken.split(".");

    if (parts.length < 2) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      account_id?: unknown;
      sub?: unknown;
      exp?: unknown;
    };

    const accountId =
      typeof decoded.account_id === "string"
        ? decoded.account_id
        : typeof decoded.sub === "string"
          ? decoded.sub
          : null;

    if (!accountId || typeof decoded.exp !== "number") {
      return null;
    }

    return { account_id: accountId, exp: decoded.exp };
  } catch {
    return null;
  }
}
