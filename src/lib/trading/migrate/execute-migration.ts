import { createAbstractSigner } from "@polymarket/builder-abstract-signer";
import {
  buildProxyTransactionRequest,
  CallType,
  encodeProxyTransactionData,
  TransactionType,
} from "@polymarket/builder-relayer-client";
import {
  encodeFunctionData,
  encodePacked,
  erc20Abi,
  formatUnits,
  hashTypedData,
  hexToBigInt,
  parseUnits,
  zeroAddress,
  type Address,
} from "viem";

import { getWalletClientForAddress } from "@/components/trading/wallet-provider";
import {
  MIN_MIGRATION_USD,
  POLYMARKET_COLLATERAL_TOKEN,
  POLYMARKET_LEGACY_PROXY_FACTORY,
  POLYMARKET_LEGACY_RELAY_HUB,
  POLYMARKET_POLYGON_CHAIN_ID,
  USDC_DECIMALS,
  type LegacyPolymarketAccountType,
} from "@/lib/trading/migrate/polymarket-migration";
import type { LegacyMigrationAccount, MigrationExecutionResult } from "@/lib/trading/migrate/types";

interface MigrationPrepareResponse {
  relayer?: {
    address?: string;
    nonce?: string;
  };
  error?: string;
}

export interface ExecuteMigrationParams {
  ownerAddress: string;
  destinationOwner: string;
  destinationDepositWallet: string;
  sourceAccount: LegacyMigrationAccount;
  amountUsd: number;
}

export function parseMigrationAmountUsd(value: string) {
  if (!/^\d+(?:\.\d{1,6})?$/.test(value.trim())) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export function validateMigrationAmount(amountUsd: number, sourceBalanceUsd: number) {
  if (amountUsd < MIN_MIGRATION_USD) {
    return "amountBelowMinimum" as const;
  }

  if (amountUsd > sourceBalanceUsd + 0.000001) {
    return "amountExceedsBalance" as const;
  }

  return undefined;
}

export async function executeLegacyMigration(
  params: ExecuteMigrationParams,
): Promise<MigrationExecutionResult> {
  const amountAtomic = parseUnits(params.amountUsd.toFixed(USDC_DECIMALS), USDC_DECIMALS);
  const validationError = validateMigrationAmount(
    params.amountUsd,
    Number(formatUnits(params.sourceAccount.balanceAtomic, USDC_DECIMALS)),
  );

  if (validationError) {
    throw new Error(validationError);
  }

  const transferData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [params.destinationDepositWallet as Address, amountAtomic],
  });

  const walletClient = await getWalletClientForAddress(params.ownerAddress, {
    chainId: POLYMARKET_POLYGON_CHAIN_ID,
  });

  const prepare = await prepareMigration({
    owner: params.ownerAddress,
    legacyType: params.sourceAccount.type,
    destinationOwner: params.destinationOwner,
    sourceAccount: params.sourceAccount.address,
  });

  const abstractSigner = createAbstractSigner(
    POLYMARKET_POLYGON_CHAIN_ID,
    walletClient as Parameters<typeof createAbstractSigner>[1],
  );
  const metadata = JSON.stringify({
    app: "world-cup-prediction-terminal",
    action: "legacy-usdc-migration",
    legacyType: params.sourceAccount.type,
    destinationDepositWallet: params.destinationDepositWallet,
  });

  const signedRequest =
    params.sourceAccount.type === "proxy"
      ? await buildProxyTransactionRequest(
          abstractSigner,
          {
            from: params.ownerAddress,
            nonce: requirePreparedValue(prepare.relayer?.nonce, "relayer nonce"),
            gasPrice: "0",
            data: encodeProxyTransactionData([
              {
                to: POLYMARKET_COLLATERAL_TOKEN,
                typeCode: CallType.Call,
                data: transferData,
                value: "0",
              },
            ]),
            relay: requirePreparedValue(prepare.relayer?.address, "relay address"),
          },
          {
            ProxyFactory: POLYMARKET_LEGACY_PROXY_FACTORY,
            RelayHub: POLYMARKET_LEGACY_RELAY_HUB,
          },
          metadata,
        )
      : await buildSafeMigrationRequest({
          abstractSigner,
          owner: params.ownerAddress,
          safeAddress: params.sourceAccount.address,
          nonce: requirePreparedValue(prepare.relayer?.nonce, "relayer nonce"),
          transferData,
          metadata,
        });

  const submitResponse = await fetch("/api/trading/migrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      legacyType: params.sourceAccount.type,
      destinationOwner: params.destinationOwner,
      sourceAccount: params.sourceAccount.address,
      amountAtomic: amountAtomic.toString(),
      request: signedRequest,
    }),
  });

  const submitPayload = (await submitResponse.json()) as {
    response?: MigrationExecutionResult;
    error?: string;
  };

  if (!submitResponse.ok || !submitPayload.response) {
    throw new Error(submitPayload.error ?? `Migration submit failed with HTTP ${submitResponse.status}.`);
  }

  return submitPayload.response;
}

async function prepareMigration({
  owner,
  legacyType,
  destinationOwner,
  sourceAccount,
}: {
  owner: string;
  legacyType: LegacyPolymarketAccountType;
  destinationOwner: string;
  sourceAccount: string;
}) {
  const params = new URLSearchParams({
    owner,
    legacyType,
    destinationOwner,
    sourceAccount,
  });

  const response = await fetch(`/api/trading/migrate?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });
  const payload = (await response.json()) as MigrationPrepareResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? `Migration prepare failed with HTTP ${response.status}.`);
  }

  return payload;
}

function requirePreparedValue(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`Migration prepare response is missing ${label}.`);
  }

  return value;
}

async function buildSafeMigrationRequest({
  abstractSigner,
  owner,
  safeAddress,
  nonce,
  transferData,
  metadata,
}: {
  abstractSigner: ReturnType<typeof createAbstractSigner>;
  owner: string;
  safeAddress: string;
  nonce: string;
  transferData: string;
  metadata: string;
}) {
  const safeTxnGas = 0n;
  const baseGas = 0n;
  const gasPrice = 0n;
  const operation = 0;
  const nonceValue = BigInt(nonce);
  const transferHex = transferData as `0x${string}`;
  const structHash = hashTypedData({
    primaryType: "SafeTx",
    domain: {
      chainId: POLYMARKET_POLYGON_CHAIN_ID,
      verifyingContract: safeAddress as Address,
    },
    types: {
      SafeTx: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" },
        { name: "safeTxGas", type: "uint256" },
        { name: "baseGas", type: "uint256" },
        { name: "gasPrice", type: "uint256" },
        { name: "gasToken", type: "address" },
        { name: "refundReceiver", type: "address" },
        { name: "nonce", type: "uint256" },
      ],
    },
    message: {
      to: POLYMARKET_COLLATERAL_TOKEN as Address,
      value: 0n,
      data: transferHex,
      operation,
      safeTxGas: safeTxnGas,
      baseGas,
      gasPrice,
      gasToken: zeroAddress,
      refundReceiver: zeroAddress,
      nonce: nonceValue,
    },
  });
  const signature = await abstractSigner.signMessage(structHash);

  return {
    from: owner,
    to: POLYMARKET_COLLATERAL_TOKEN,
    proxyWallet: safeAddress,
    data: transferData,
    nonce,
    signature: splitAndPackSignature(signature),
    signatureParams: {
      gasPrice: gasPrice.toString(),
      operation: `${operation}`,
      safeTxnGas: safeTxnGas.toString(),
      baseGas: baseGas.toString(),
      gasToken: zeroAddress,
      refundReceiver: zeroAddress,
    },
    type: TransactionType.SAFE,
    metadata,
  };
}

function splitAndPackSignature(signature: string) {
  let signatureV = Number.parseInt(signature.slice(-2), 16);

  if (signatureV === 0 || signatureV === 1) {
    signatureV += 31;
  } else if (signatureV === 27 || signatureV === 28) {
    signatureV += 4;
  } else {
    throw new Error("Invalid Safe signature returned by wallet.");
  }

  const normalized = `${signature.slice(0, -2)}${signatureV.toString(16)}`;

  return encodePacked(
    ["uint256", "uint256", "uint8"],
    [
      hexToBigInt(`0x${normalized.slice(2, 66)}`),
      hexToBigInt(`0x${normalized.slice(66, 130)}`),
      Number(hexToBigInt(`0x${normalized.slice(130, 132)}`)),
    ],
  );
}
