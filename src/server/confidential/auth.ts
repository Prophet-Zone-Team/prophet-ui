import "server-only";

import { IntentsSDK, VersionedNonceBuilder } from "@defuse-protocol/intents-sdk";
import { messageFactory, prepareBroadcastRequest } from "@defuse-protocol/internal-utils";
import { base64 } from "@scure/base";
import { createLocalJWKSet, jwtVerify } from "jose";

import { getConfidentialEnv } from "./env";
import { deriveIntentsUserId } from "./intents-user-id";

/** Signing standard expected by 1Click for each auth method. */
export const EVM_INTENT_STANDARD = "erc191" as const;

const VERIFICATION_MESSAGE_TTL_MS = 5 * 60_000;

let intentsSdk: IntentsSDK | undefined;

function getIntentsSdk(): IntentsSDK {
  if (!intentsSdk) {
    intentsSdk = new IntentsSDK({
      env: getConfidentialEnv().nearIntentsEnv,
      referral: "prophet",
    });
  }

  return intentsSdk;
}

/**
 * Build the ERC191 verification message a user must sign to authenticate the
 * Confidential account. The message embeds a versioned nonce and deadline, so
 * the challenge is stateless and can round-trip to the client and back.
 */
export async function createVerificationMessage(eoaAddress: string): Promise<{
  message: string;
  intentsUserId: string;
}> {
  const intentsUserId = deriveIntentsUserId(eoaAddress);
  const deadline = Date.now() + VERIFICATION_MESSAGE_TTL_MS;

  const intentPayload = await getIntentsSdk()
    .intentBuilder()
    .setSigner(intentsUserId)
    .setDeadline(new Date(deadline))
    .setNonceRandomBytes(VersionedNonceBuilder.createTimestampedNonceBytes(new Date()))
    .build();

  const nonceBytes = base64.decode(intentPayload.nonce);

  const walletMessage = messageFactory.makeEmptyMessage({
    signerId: intentsUserId,
    deadlineTimestamp: deadline,
    nonce: nonceBytes,
  });

  return {
    message: walletMessage.ERC191.message,
    intentsUserId,
  };
}

/**
 * Rebuild the signed MultiPayload from the client's ERC191 signature so it can
 * be submitted to /v0/auth/authenticate.
 */
export function buildAuthSignedData(
  eoaAddress: string,
  message: string,
  signature: string,
): unknown {
  return prepareBroadcastRequest.prepareSwapSignedData(
    {
      type: "ERC191",
      signatureData: signature,
      signedData: { message },
    },
    { userAddress: eoaAddress, userChainType: "evm" },
  );
}

export interface AccessTokenIdentity {
  accountId: string;
  exp?: number;
}

/**
 * Verify the JWT belongs to the expected Confidential account. The
 * account_id/sub claim MUST match the locally derived intentsUserId. When a
 * JWKS + issuer are configured the signature is verified too; otherwise the
 * payload is decoded for the identity check only.
 */
export async function verifyAccessTokenIdentity(
  token: string,
  intentsUserId: string,
): Promise<AccessTokenIdentity | null> {
  const env = getConfidentialEnv();
  let payload: Record<string, unknown> | undefined;

  if (env.jwtPublicKey && env.jwtIssuer) {
    try {
      const jwks = createLocalJWKSet(JSON.parse(env.jwtPublicKey));
      const result = await jwtVerify(token, jwks, { issuer: env.jwtIssuer });
      payload = result.payload as Record<string, unknown>;
    } catch {
      return null;
    }
  } else {
    payload = decodeJwtPayload(token);
  }

  if (!payload) {
    return null;
  }

  const accountId =
    typeof payload.account_id === "string"
      ? payload.account_id
      : typeof payload.sub === "string"
        ? payload.sub
        : null;

  if (!accountId || accountId.toLowerCase() !== intentsUserId.toLowerCase()) {
    return null;
  }

  return {
    accountId,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
  };
}

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  const segment = token.split(".")[1];

  if (!segment) {
    return undefined;
  }

  try {
    const json = Buffer.from(segment, "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
