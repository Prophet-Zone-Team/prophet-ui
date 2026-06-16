import { Buffer } from "buffer";
import { utils } from "near-api-js";
import type { FinalExecutionOutcome } from "@near-wallet-selector/core";
import { getAddress, keccak256 } from "viem";

import {
  ONE_YOCTO_NEAR,
  V1_SIGNER_CONTRACT_ID,
  V1_SIGNER_DOMAIN_ID,
  V1_SIGNER_SIGN_GAS,
} from "./near-config";
import { getNearAccountSnapshot } from "./near-account-store";
import { viewFunction } from "./near-rpc";
import {
  formatV1SignerEvmSignature,
  getV1SignerEvmDerivationPath,
  isV1SignerSignature,
  normalizeV1SignerDigest,
} from "./v1-signer-format";
import type { V1SignerNearSignature } from "./v1-signer-format";

export type V1SignerDerivedAddress = {
  address: string;
  publicKey: string;
  path: string;
  contractId: string;
};

export type V1SignerDigestSignature = {
  nearSignature: V1SignerNearSignature;
  evmSignature: `0x${string}`;
  txHash?: string;
};

function decodeSuccessValue(successValue: string) {
  if (!successValue) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(successValue, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

function getSignatureFromExecutionOutcome(
  outcome: FinalExecutionOutcome | undefined,
): V1SignerNearSignature | null {
  if (!outcome) {
    return null;
  }

  const candidates = [
    outcome.transaction_outcome,
    ...(outcome.receipts_outcome ?? []),
  ];

  for (const candidate of candidates) {
    const status = candidate?.outcome?.status as
      | { SuccessValue?: string }
      | undefined;
    const decoded = decodeSuccessValue(status?.SuccessValue ?? "");

    if (isV1SignerSignature(decoded)) {
      return decoded;
    }
  }

  return null;
}

export async function deriveV1SignerEvmAddress(
  nearAccountId: string,
): Promise<V1SignerDerivedAddress> {
  const path = getV1SignerEvmDerivationPath(nearAccountId);
  const derivedPublicKey = await viewFunction<string>({
    contractId: V1_SIGNER_CONTRACT_ID,
    methodName: "derived_public_key",
    args: {
      path,
      predecessor: nearAccountId,
      domain_id: V1_SIGNER_DOMAIN_ID,
    },
  });

  const publicKeyBytes = utils.PublicKey.from(derivedPublicKey).data;
  const uncompressedPublicKey = Buffer.from(publicKeyBytes).toString("hex");
  const publicKeyWithoutPrefix = uncompressedPublicKey.startsWith("04")
    ? uncompressedPublicKey.slice(2)
    : uncompressedPublicKey;
  const publicKeyHash = keccak256(`0x${publicKeyWithoutPrefix}` as `0x${string}`);

  return {
    address: getAddress(`0x${publicKeyHash.slice(-40)}`),
    publicKey: `0x${publicKeyWithoutPrefix}`,
    path,
    contractId: V1_SIGNER_CONTRACT_ID,
  };
}

async function getActiveNearWallet() {
  const { selector } = getNearAccountSnapshot();

  if (!selector) {
    throw new Error("NEAR wallet selector is not initialized.");
  }

  return selector.wallet();
}

export async function signDigestWithV1Signer(
  digest: string,
  nearAccountId: string,
): Promise<V1SignerDigestSignature> {
  const payload = normalizeV1SignerDigest(digest);
  const path = getV1SignerEvmDerivationPath(nearAccountId);
  const wallet = await getActiveNearWallet();

  const outcomes = await wallet.signAndSendTransactions({
    transactions: [
      {
        signerId: nearAccountId,
        receiverId: V1_SIGNER_CONTRACT_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "sign",
              args: {
                request: {
                  payload_v2: { Ecdsa: payload },
                  path,
                  domain_id: V1_SIGNER_DOMAIN_ID,
                },
              },
              gas: V1_SIGNER_SIGN_GAS,
              deposit: ONE_YOCTO_NEAR,
            },
          },
        ],
      },
    ],
  });

  const outcome = Array.isArray(outcomes) ? outcomes[0] : outcomes;
  const nearSignature = getSignatureFromExecutionOutcome(
    outcome as FinalExecutionOutcome | undefined,
  );

  if (!nearSignature) {
    throw new Error("v1.signer signature was not found in transaction receipts.");
  }

  return {
    nearSignature,
    evmSignature: formatV1SignerEvmSignature(nearSignature),
    txHash: (outcome as FinalExecutionOutcome | undefined)?.transaction_outcome
      ?.id,
  };
}
