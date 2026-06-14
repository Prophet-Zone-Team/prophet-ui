import { NextResponse } from "next/server";
import { TransactionType } from "@polymarket/builder-relayer-client";
import { decodeFunctionData, erc20Abi } from "viem";

import {
  deriveLegacyPolymarketAccount,
  derivePolymarketDepositWallet,
  MIN_MIGRATION_ATOMIC,
  POLYMARKET_COLLATERAL_TOKEN,
  POLYMARKET_LEGACY_PROXY_FACTORY,
  type LegacyPolymarketAccountType,
} from "@/lib/trading/migrate/polymarket-migration";
import { submitRelayerTransaction } from "@/server/trading/deposit-wallet";
import { fetchRelayerPayload, fetchSafeNonce } from "@/server/trading/migration-relayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MigrationSubmitPayload {
  legacyType?: unknown;
  destinationOwner?: unknown;
  sourceAccount?: unknown;
  amountAtomic?: unknown;
  request?: unknown;
}

interface LegacyTransactionRequest {
  type?: unknown;
  from?: unknown;
  to?: unknown;
  proxyWallet?: unknown;
  data?: unknown;
  nonce?: unknown;
  signature?: unknown;
  signatureParams?: unknown;
  metadata?: unknown;
}

const PROXY_WALLET_FACTORY_ABI = [
  {
    name: "proxy",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "calls",
        type: "tuple[]",
        components: [
          { name: "typeCode", type: "uint8" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
    outputs: [{ name: "returnValues", type: "bytes[]" }],
  },
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ownerAddress = normalizeAddress(url.searchParams.get("owner"));
  const legacyType = parseLegacyType(url.searchParams.get("legacyType"));
  const destinationOwner = normalizeAddress(url.searchParams.get("destinationOwner")) ?? ownerAddress;
  const sourceAccount = normalizeAddress(url.searchParams.get("sourceAccount"));

  if (!ownerAddress) {
    return NextResponse.json({ error: "A valid owner wallet address is required." }, { status: 400 });
  }

  if (!legacyType) {
    return NextResponse.json({ error: "legacyType must be proxy or safe." }, { status: 400 });
  }

  try {
    const legacyAccount = resolveLegacyAccount({
      ownerAddress,
      legacyType,
      sourceAccount,
    });
    const relayer =
      legacyType === "proxy"
        ? await fetchRelayerPayload(ownerAddress, TransactionType.PROXY)
        : { nonce: await fetchSafeNonce(legacyAccount) };

    return NextResponse.json({
      ownerAddress,
      legacyType,
      legacyAccount,
      destinationOwner,
      destinationDepositWallet: destinationOwner ? derivePolymarketDepositWallet(destinationOwner) : undefined,
      relayer,
    });
  } catch (error) {
    console.error("[trading.migrate] prepare failed", {
      legacyType,
      sourceAccount,
      destinationOwner,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as MigrationSubmitPayload;
  const legacyType = parseLegacyType(payload.legacyType);
  const destinationOwner = normalizeAddress(payload.destinationOwner);
  const sourceAccount = normalizeAddress(payload.sourceAccount);
  const amountAtomic = parsePositiveAtomic(payload.amountAtomic);
  const signedRequest = payload.request as LegacyTransactionRequest | undefined;

  if (!legacyType) {
    return NextResponse.json({ error: "legacyType must be proxy or safe." }, { status: 400 });
  }

  if (!destinationOwner) {
    return NextResponse.json({ error: "A valid destination owner address is required." }, { status: 400 });
  }

  if (!amountAtomic) {
    return NextResponse.json({ error: "A positive migration amount is required." }, { status: 400 });
  }

  if (amountAtomic < MIN_MIGRATION_ATOMIC) {
    return NextResponse.json(
      { error: `Minimum migration amount is $${Number(MIN_MIGRATION_ATOMIC) / 1_000_000}.` },
      { status: 400 },
    );
  }

  const validationError = validateMigrationRequest({
    request: signedRequest,
    legacyType,
    destinationOwner,
    sourceAccount,
    amountAtomic,
  });

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const response = await submitRelayerTransaction(
      JSON.stringify(signedRequest),
      "Unable to submit Polymarket legacy account migration",
    );

    return NextResponse.json({
      response,
      submittedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

function validateMigrationRequest({
  request,
  legacyType,
  destinationOwner,
  sourceAccount,
  amountAtomic,
}: {
  request: LegacyTransactionRequest | undefined;
  legacyType: LegacyPolymarketAccountType;
  destinationOwner: string;
  sourceAccount?: string;
  amountAtomic: bigint;
}) {
  if (!request || typeof request !== "object") {
    return "Signed migration request is required.";
  }

  const from = normalizeAddress(request.from);

  if (!from) {
    return "Signed migration request is missing a valid owner address.";
  }

  if (typeof request.signature !== "string" || !/^0x[a-fA-F0-9]+$/.test(request.signature)) {
    return "Signed migration request is missing a valid signature.";
  }

  const expectedLegacyAccount = resolveLegacyAccount({
    ownerAddress: from,
    legacyType,
    sourceAccount,
  }).toLowerCase();
  const proxyWallet = normalizeAddress(request.proxyWallet);

  if (proxyWallet?.toLowerCase() !== expectedLegacyAccount) {
    return "Signed migration request does not target the expected legacy account.";
  }

  const destinationDepositWallet = derivePolymarketDepositWallet(destinationOwner).toLowerCase();

  if (legacyType === "safe") {
    if (request.type !== TransactionType.SAFE) {
      return "Safe migrations must use a SAFE relayer request.";
    }

    const to = normalizeAddress(request.to);

    if (to?.toLowerCase() !== POLYMARKET_COLLATERAL_TOKEN.toLowerCase()) {
      return "Safe migration can only transfer Polymarket collateral USDC.";
    }

    return validateTransferCalldata(request.data, destinationDepositWallet, amountAtomic);
  }

  if (request.type !== TransactionType.PROXY) {
    return "Proxy migrations must use a PROXY relayer request.";
  }

  const to = normalizeAddress(request.to);

  if (to?.toLowerCase() !== POLYMARKET_LEGACY_PROXY_FACTORY.toLowerCase()) {
    return "Proxy migration must target the Polymarket proxy factory.";
  }

  try {
    const decoded = decodeFunctionData({
      abi: PROXY_WALLET_FACTORY_ABI,
      data: request.data as `0x${string}`,
    });

    if (decoded.functionName !== "proxy" || decoded.args[0].length !== 1) {
      return "Proxy migration must contain exactly one transfer call.";
    }

    const [call] = decoded.args[0];

    if (
      Number(call.typeCode) !== 1 ||
      call.to.toLowerCase() !== POLYMARKET_COLLATERAL_TOKEN.toLowerCase() ||
      call.value !== 0n
    ) {
      return "Proxy migration can only transfer Polymarket collateral USDC.";
    }

    return validateTransferCalldata(call.data, destinationDepositWallet, amountAtomic);
  } catch {
    return "Proxy migration calldata is malformed.";
  }
}

function validateTransferCalldata(data: unknown, destinationDepositWallet: string, amountAtomic: bigint) {
  try {
    if (typeof data !== "string" || !/^0x[a-fA-F0-9]+$/.test(data)) {
      return "Migration transfer calldata is missing.";
    }

    const decoded = decodeFunctionData({
      abi: erc20Abi,
      data: data as `0x${string}`,
    });

    if (
      decoded.functionName !== "transfer" ||
      decoded.args[0].toLowerCase() !== destinationDepositWallet ||
      decoded.args[1] !== amountAtomic
    ) {
      return "Migration transfer must send the requested USDC amount to the derived deposit wallet.";
    }

    return undefined;
  } catch {
    return "Migration transfer calldata is malformed.";
  }
}

function parseLegacyType(value: unknown): LegacyPolymarketAccountType | undefined {
  return value === "proxy" || value === "safe" ? value : undefined;
}

function resolveLegacyAccount({
  ownerAddress,
  legacyType,
  sourceAccount,
}: {
  ownerAddress: string;
  legacyType: LegacyPolymarketAccountType;
  sourceAccount?: string;
}) {
  if (legacyType === "safe" && sourceAccount) {
    return sourceAccount;
  }

  return deriveLegacyPolymarketAccount(ownerAddress, legacyType);
}

function normalizeAddress(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value) ? value : undefined;
}

function parsePositiveAtomic(value: unknown) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = BigInt(value);

  return parsed > 0n ? parsed : undefined;
}
