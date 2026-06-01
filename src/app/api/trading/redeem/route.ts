import { NextResponse } from "next/server";
import { recoverTypedDataAddress } from "viem";

import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";
import { buildRedeemBatch } from "@/lib/market/redeem-batch";
import { getTradingChainId } from "@/server/trading/clob-auth";
import { getTradingContractAddresses } from "@/server/trading/contracts";
import { fetchUserPositions } from "@/server/trading/clob-user-client";
import {
  buildDepositWalletBatchRequest,
  fetchRelayerNonce,
  fetchRelayerTransaction,
  submitRelayerTransaction,
} from "@/server/trading/deposit-wallet";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RedeemSubmitPayload {
  signature?: string;
  transfer?: DepositWalletBatchSignablePayload;
}

const CONDITION_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Trading session is missing a deposit wallet." }, { status: 409 });
  }

  if (record.session.depositWalletStatus !== "deployed") {
    return NextResponse.json(
      {
        error: "Deposit wallet must be deployed before redeeming positions.",
        status: record.session.depositWalletStatus ?? "unknown",
      },
      { status: 409 },
    );
  }

  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId")?.trim();
  const conditionId = url.searchParams.get("conditionId")?.trim();

  try {
    if (transactionId) {
      if (!/^[A-Za-z0-9_-]+$/.test(transactionId)) {
        return NextResponse.json({ error: "transactionId is invalid." }, { status: 400 });
      }

      return NextResponse.json({
        transaction: await fetchRelayerTransaction(transactionId),
      });
    }

    if (!conditionId || !CONDITION_ID_PATTERN.test(conditionId)) {
      return NextResponse.json({ error: "conditionId must be a valid 32-byte hex string." }, { status: 400 });
    }

    const positions = await fetchUserPositions({
      userAddress: record.session.funderAddress,
      conditionIds: [conditionId],
      limit: 10,
    });
    const redeemablePosition = positions.find(
      (position) =>
        position.conditionId.toLowerCase() === conditionId.toLowerCase() &&
        position.redeemable &&
        position.size > 0,
    );

    if (!redeemablePosition) {
      return NextResponse.json(
        { error: "No redeemable position was found for this market." },
        { status: 409 },
      );
    }

    const nonce = await fetchRelayerNonce(record.session.walletAddress);
    const deadline = Math.floor(Date.now() / 1000 + 900).toString();
    const contracts = getTradingContractAddresses();

    return NextResponse.json({
      funderAddress: record.session.funderAddress,
      conditionId,
      negativeRisk: redeemablePosition.negativeRisk,
      transfer: buildRedeemBatch({
        chainId: getTradingChainId(),
        walletAddress: record.session.funderAddress,
        nonce,
        deadline,
        conditionId,
        negativeRisk: redeemablePosition.negativeRisk,
        collateralToken: contracts.collateralToken,
        conditionalTokens: contracts.conditionalTokens,
        ctfCollateralAdapter: contracts.ctfCollateralAdapter,
        negRiskCtfCollateralAdapter: contracts.negRiskCtfCollateralAdapter,
        includeAdapterApproval: true,
      }),
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

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Trading session is missing a deposit wallet." }, { status: 409 });
  }

  if (record.session.depositWalletStatus !== "deployed") {
    return NextResponse.json(
      {
        error: "Deposit wallet must be deployed before redeeming positions.",
        status: record.session.depositWalletStatus ?? "unknown",
      },
      { status: 409 },
    );
  }

  const payload = (await request.json()) as RedeemSubmitPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const submittedTransfer = payload.transfer!;

  if (submittedTransfer.message.wallet.toLowerCase() !== record.session.funderAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Signed redeem wallet does not match the session deposit wallet." },
      { status: 409 },
    );
  }

  try {
    const recoveredAddress = await recoverTypedDataAddress({
      domain: submittedTransfer.domain ?? {},
      types: submittedTransfer.types ?? {},
      primaryType: submittedTransfer.primaryType ?? "Batch",
      message: submittedTransfer.message ?? {},
      signature: payload.signature as `0x${string}`,
    });

    if (recoveredAddress.toLowerCase() !== record.session.walletAddress.toLowerCase()) {
      return NextResponse.json(
        {
          error: `Redeem signature recovered ${recoveredAddress}, which does not match connected wallet ${record.session.walletAddress}.`,
        },
        { status: 400 },
      );
    }

    const requestBody = JSON.stringify(
      buildDepositWalletBatchRequest({
        ownerAddress: record.session.walletAddress,
        walletAddress: submittedTransfer.message.wallet ?? "",
        nonce: submittedTransfer.message.nonce ?? "",
        deadline: submittedTransfer.message.deadline ?? "",
        calls: submittedTransfer.message.calls ?? [],
        signature: payload.signature ?? "",
      }),
    );
    const response = await submitRelayerTransaction(requestBody, "Unable to submit deposit wallet redeem batch");

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

function validatePayload(payload: RedeemSubmitPayload): string | undefined {
  if (!payload.signature || !/^0x[a-fA-F0-9]+$/.test(payload.signature)) {
    return "signature is required.";
  }

  if (!payload.transfer?.message?.wallet) {
    return "transfer payload is required.";
  }

  return undefined;
}
