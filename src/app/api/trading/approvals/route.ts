import { NextResponse } from "next/server";

import { buildTradingApprovalBatch } from "../../../../lib/market/depositWalletBatch";
import { getTradingChainId } from "../../../../server/trading/clobAuth";
import {
  buildDepositWalletBatchRequest,
  fetchRelayerTransaction,
  fetchRelayerNonce,
  submitRelayerTransaction,
} from "../../../../server/trading/depositWallet";
import { getTradingContractAddresses } from "../../../../server/trading/contracts";
import { getTradingSessionFromCookie } from "../../../../server/trading/sessionStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApprovalSubmitPayload {
  signature?: string;
  nonce?: string;
  deadline?: string;
}

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
        error: "Deposit wallet must be deployed before approvals can be signed.",
        status: record.session.depositWalletStatus ?? "unknown",
      },
      { status: 409 },
    );
  }

  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get("transactionId");

    if (transactionId) {
      if (!/^[A-Za-z0-9_-]+$/.test(transactionId)) {
        return NextResponse.json({ error: "transactionId is invalid." }, { status: 400 });
      }

      return NextResponse.json({
        transaction: await fetchRelayerTransaction(transactionId),
      });
    }

    const nonce = await fetchRelayerNonce(record.session.walletAddress);
    const deadline = Math.floor(Date.now() / 1000 + 900).toString();

    return NextResponse.json({
      approval: buildTradingApprovalBatch({
        chainId: getTradingChainId(),
        walletAddress: record.session.funderAddress,
        nonce,
        deadline,
        ...getTradingContractAddresses(),
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
        error: "Deposit wallet must be deployed before approvals can be submitted.",
        status: record.session.depositWalletStatus ?? "unknown",
      },
      { status: 409 },
    );
  }

  const payload = (await request.json()) as ApprovalSubmitPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const approval = buildTradingApprovalBatch({
      chainId: getTradingChainId(),
      walletAddress: record.session.funderAddress,
      nonce: payload.nonce ?? "",
      deadline: payload.deadline ?? "",
      ...getTradingContractAddresses(),
    });
    const requestBody = JSON.stringify(
      buildDepositWalletBatchRequest({
        ownerAddress: record.session.walletAddress,
        walletAddress: record.session.funderAddress,
        nonce: approval.nonce,
        deadline: approval.deadline,
        calls: approval.calls,
        signature: payload.signature ?? "",
      }),
    );
    const response = await submitRelayerTransaction(requestBody, "Unable to submit deposit wallet approvals");

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

function validatePayload(payload: ApprovalSubmitPayload): string | undefined {
  if (!payload.signature || !/^0x[a-fA-F0-9]+$/.test(payload.signature)) {
    return "Missing or invalid approval batch signature.";
  }

  if (!payload.nonce || !/^\d+$/.test(payload.nonce)) {
    return "Missing or invalid approval nonce.";
  }

  if (!payload.deadline || !/^\d+$/.test(payload.deadline)) {
    return "Missing or invalid approval deadline.";
  }

  return undefined;
}
