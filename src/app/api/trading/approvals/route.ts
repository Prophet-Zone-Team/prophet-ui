import { NextResponse } from "next/server";

import { buildTradingApprovalBatch, type DepositWalletBatchSignablePayload } from "../../../../lib/market/depositWalletBatch";
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
  approval?: DepositWalletBatchSignablePayload;
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
    console.warn("[trading.approvals] submit failed", {
      userId: record.session.userId,
      walletAddress: record.session.walletAddress,
      funderAddress: record.session.funderAddress,
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
    const expectedApproval = buildTradingApprovalBatch({
      chainId: getTradingChainId(),
      walletAddress: record.session.funderAddress,
      nonce: payload.nonce ?? "",
      deadline: payload.deadline ?? "",
      ...getTradingContractAddresses(),
    });
    const submittedApproval = payload.approval;
    const approvalMismatch = validateSubmittedApproval(submittedApproval, expectedApproval);

    if (approvalMismatch) {
      return NextResponse.json({ error: approvalMismatch }, { status: 409 });
    }

    const requestBody = JSON.stringify(
      buildDepositWalletBatchRequest({
        ownerAddress: record.session.walletAddress,
        walletAddress: record.session.funderAddress,
        nonce: submittedApproval?.nonce ?? "",
        deadline: submittedApproval?.deadline ?? "",
        calls: submittedApproval?.calls ?? [],
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

function validateSubmittedApproval(
  submittedApproval: DepositWalletBatchSignablePayload | undefined,
  expectedApproval: DepositWalletBatchSignablePayload,
) {
  if (!submittedApproval) {
    return "Missing signed approval payload.";
  }

  if (submittedApproval.walletAddress.toLowerCase() !== expectedApproval.walletAddress.toLowerCase()) {
    return "Signed approval wallet does not match the current session deposit wallet.";
  }

  if (submittedApproval.nonce !== expectedApproval.nonce || submittedApproval.deadline !== expectedApproval.deadline) {
    return "Signed approval nonce or deadline changed. Refresh and approve trading again.";
  }

  if (normalizeApprovalCalls(submittedApproval.calls) !== normalizeApprovalCalls(expectedApproval.calls)) {
    return "Signed approval calls changed. Refresh and approve trading again.";
  }

  return undefined;
}

function normalizeApprovalCalls(calls: DepositWalletBatchSignablePayload["calls"]) {
  return JSON.stringify(
    calls.map((call) => ({
      target: call.target.toLowerCase(),
      value: call.value,
      data: call.data.toLowerCase(),
    })),
  );
}
