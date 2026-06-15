import { V1_SIGNER_EVM_DERIVATION_PATH_PREFIX } from "./near-config";

export type V1SignerNearSignature = {
  big_r: { affine_point: string };
  s: { scalar: string };
  recovery_id: number;
};

export function getV1SignerEvmDerivationPath(nearAccountId: string): string {
  const normalizedAccountId = nearAccountId.trim();

  if (!normalizedAccountId) {
    throw new Error("NEAR account is required for v1.signer.");
  }

  return `${V1_SIGNER_EVM_DERIVATION_PATH_PREFIX}:${normalizedAccountId}`;
}

export function normalizeV1SignerDigest(digest: string): string {
  const normalizedDigest = digest.replace(/^0x/i, "");

  if (!/^[a-fA-F0-9]{64}$/.test(normalizedDigest)) {
    throw new Error("EVM digest must be a 32-byte hex string.");
  }

  return normalizedDigest;
}

export function formatV1SignerEvmSignature(
  signature: V1SignerNearSignature,
): `0x${string}` {
  const affinePoint = signature.big_r.affine_point.replace(/^0x/i, "");

  if (!/^(02|03)[a-fA-F0-9]{64}$/.test(affinePoint)) {
    throw new Error("MPC signature big_r must be a compressed secp256k1 point.");
  }

  const r = affinePoint.slice(2);
  const s = signature.s.scalar.replace(/^0x/i, "");

  if (!/^[a-fA-F0-9]{64}$/.test(s)) {
    throw new Error("MPC signature s must be a 32-byte hex string.");
  }

  if (![0, 1].includes(signature.recovery_id)) {
    throw new Error("MPC signature recovery id must be 0 or 1.");
  }

  const v = (signature.recovery_id + 27).toString(16).padStart(2, "0");

  return `0x${r}${s}${v}`;
}

export function isV1SignerSignature(
  value: unknown,
): value is V1SignerNearSignature {
  const signature = value as V1SignerNearSignature;

  return (
    !!signature?.big_r?.affine_point &&
    !!signature?.s?.scalar &&
    typeof signature?.recovery_id === "number"
  );
}
