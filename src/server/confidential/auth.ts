import "server-only";

import { IntentsSDK, VersionedNonceBuilder } from "@defuse-protocol/intents-sdk";
import { messageFactory, type walletMessage } from "@defuse-protocol/internal-utils";
import { base64 } from "@scure/base";

import { getOneClickConfig } from "@/server/confidential/config";
import { deriveIntentsUserId, normalizeEvmAddress } from "@/server/confidential/identity";
import { verifyAccessTokenIdentity } from "@/server/confidential/jwt";
import {
  oneClickAuthenticate,
  oneClickRefresh,
} from "@/server/confidential/one-click-client";
import {
  buildConfidentialSessionRecord,
  getConfidentialSessionFromCookie,
  saveConfidentialSession,
  type ConfidentialSessionRecord,
} from "@/server/confidential/session-store";

let intentsSdk: IntentsSDK | undefined;

function getIntentsSdk() {
  if (!intentsSdk) {
    const config = getOneClickConfig();
    intentsSdk = new IntentsSDK({
      env: config.intentsEnv,
      referral: config.referral,
    });
  }

  return intentsSdk;
}

export async function createVerificationMessage(walletAddress: string): Promise<walletMessage.WalletMessage> {
  const normalizedWallet = normalizeEvmAddress(walletAddress);
  const signerId = deriveIntentsUserId(normalizedWallet);
  const deadline = Date.now() + 5 * 60_000;

  const intentPayload = await getIntentsSdk()
    .intentBuilder()
    .setSigner(signerId as never)
    .setDeadline(new Date(deadline))
    .setNonceRandomBytes(VersionedNonceBuilder.createTimestampedNonceBytes(new Date()))
    .build();

  const nonceBytes = base64.decode(intentPayload.nonce);

  return messageFactory.makeEmptyMessage({
    signerId: signerId as never,
    deadlineTimestamp: deadline,
    nonce: nonceBytes,
  });
}

export async function completeConfidentialAuthentication({
  walletAddress,
  signedData,
}: {
  walletAddress: string;
  signedData: unknown;
}): Promise<ConfidentialSessionRecord> {
  const normalizedWallet = normalizeEvmAddress(walletAddress);
  const authResponse = await oneClickAuthenticate(signedData);
  const verified = await verifyAccessTokenIdentity(authResponse.accessToken, normalizedWallet);

  if (!verified) {
    throw new Error("Authenticated token does not match the connected wallet.");
  }

  const record = buildConfidentialSessionRecord({
    walletAddress: normalizedWallet,
    accessToken: authResponse.accessToken,
    refreshToken: authResponse.refreshToken,
    expiresIn: authResponse.expiresIn,
    refreshExpiresIn: authResponse.refreshExpiresIn,
  });

  saveConfidentialSession(record);
  return record;
}

export async function resolveConfidentialSession(
  cookieHeader: string | null,
  expectedWalletAddress?: string,
): Promise<ConfidentialSessionRecord | undefined> {
  const record = getConfidentialSessionFromCookie(cookieHeader);

  if (!record) {
    return undefined;
  }

  if (expectedWalletAddress && !addressesMatch(record.walletAddress, expectedWalletAddress)) {
    return undefined;
  }

  const verified = await verifyAccessTokenIdentity(record.accessToken, record.walletAddress);

  if (verified) {
    return record;
  }

  try {
    const refreshed = await oneClickRefresh(record.refreshToken);
    const nextVerified = await verifyAccessTokenIdentity(refreshed.accessToken, record.walletAddress);

    if (!nextVerified) {
      return undefined;
    }

    const nextRecord: ConfidentialSessionRecord = {
      ...record,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? record.refreshToken,
      accessExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveConfidentialSession(nextRecord);
    return nextRecord;
  } catch {
    return undefined;
  }
}

function addressesMatch(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
