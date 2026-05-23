import { NextResponse } from "next/server";
import { recoverTypedDataAddress } from "viem";

import { buildTradingApprovalBatch, type DepositWalletBatchSignablePayload } from "../../../../lib/market/deposit-wallet-batch";
import { getTradingChainId } from "../../../../server/trading/clob-auth";
import {
  buildDepositWalletBatchRequest,
  fetchRelayerTransaction,
  fetchRelayerNonce,
  submitRelayerTransaction,
} from "../../../../server/trading/deposit-wallet";
import { getTradingContractAddresses } from "../../../../server/trading/contracts";
import { getTradingSessionFromCookie } from "../../../../server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApprovalSubmitPayload {
  signature?: string;
  nonce?: string;
  deadline?: string;
  sessionSignerAddress?: string;
  sessionSignerValidUntil?: string;
  approval?: DepositWalletBatchSignablePayload;
}

const DEFAULT_SESSION_SIGNER_VALIDITY_SECONDS = 60 * 60 * 24 * 7;
const MAX_SESSION_SIGNER_VALIDITY_SECONDS = 60 * 60 * 24 * 30;

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

    const sessionSignerOptions = getSessionSignerOptionsFromSearch(url.searchParams);

    if (sessionSignerOptions.error) {
      return NextResponse.json({ error: sessionSignerOptions.error }, { status: 400 });
    }

    const nonce = await fetchRelayerNonce(record.session.walletAddress);
    const deadline = Math.floor(Date.now() / 1000 + 900).toString();

    return NextResponse.json({
      approval: buildTradingApprovalBatch({
        chainId: getTradingChainId(),
        walletAddress: record.session.funderAddress,
        nonce,
        deadline,
        ...sessionSignerOptions.value,
        ...getTradingContractAddresses(),
      }),
      sessionSigner: sessionSignerOptions.value,
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

  const sessionSignerError = validateSessionSignerPayload(payload);

  if (sessionSignerError) {
    return NextResponse.json({ error: sessionSignerError }, { status: 400 });
  }

  try {
    const expectedApproval = buildTradingApprovalBatch({
      chainId: getTradingChainId(),
      walletAddress: record.session.funderAddress,
      nonce: payload.nonce ?? "",
      deadline: payload.deadline ?? "",
      sessionSignerAddress: payload.sessionSignerAddress,
      sessionSignerValidUntil: payload.sessionSignerValidUntil,
      ...getTradingContractAddresses(),
    });
    const submittedApproval = payload.approval;
    const approvalMismatch = validateSubmittedApproval(submittedApproval, expectedApproval);

    if (approvalMismatch) {
      return NextResponse.json({ error: approvalMismatch }, { status: 409 });
    }

    const recoveredAddress = await recoverTypedDataAddress({
      domain: submittedApproval?.domain ?? {},
      types: submittedApproval?.types ?? {},
      primaryType: submittedApproval?.primaryType ?? "Batch",
      message: submittedApproval?.message ?? {},
      signature: payload.signature as `0x${string}`,
    });

    if (recoveredAddress.toLowerCase() !== record.session.walletAddress.toLowerCase()) {
      return NextResponse.json(
        {
          error: `Approval signature recovered ${recoveredAddress}, which does not match connected wallet ${record.session.walletAddress}. Disable conflicting wallet extensions and reconnect the intended wallet.`,
        },
        { status: 400 },
      );
    }

    const requestBody = JSON.stringify(
      buildDepositWalletBatchRequest({
        ownerAddress: record.session.walletAddress,
        walletAddress: submittedApproval?.message.wallet ?? "",
        nonce: submittedApproval?.message.nonce ?? "",
        deadline: submittedApproval?.message.deadline ?? "",
        calls: submittedApproval?.message.calls ?? [],
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

function getSessionSignerOptionsFromSearch(searchParams: URLSearchParams):
  | {
      value: {
        sessionSignerAddress?: string;
        sessionSignerValidUntil?: string;
      };
      error?: undefined;
    }
  | { value?: undefined; error: string } {
  const sessionSignerAddress = searchParams.get("sessionSigner") ?? searchParams.get("sessionSignerAddress") ?? undefined;
  const requestedValidUntil = searchParams.get("sessionSignerValidUntil") ?? undefined;

  if (!sessionSignerAddress) {
    return { value: {} };
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(sessionSignerAddress)) {
    return { error: "sessionSigner must be a valid EVM address." };
  }

  const sessionSignerValidUntil =
    requestedValidUntil ?? Math.floor(Date.now() / 1000 + DEFAULT_SESSION_SIGNER_VALIDITY_SECONDS).toString();
  const expiryError = validateSessionSignerExpiry(sessionSignerValidUntil);

  if (expiryError) {
    return { error: expiryError };
  }

  return {
    value: {
      sessionSignerAddress,
      sessionSignerValidUntil,
    },
  };
}

function validateSessionSignerPayload(payload: ApprovalSubmitPayload): string | undefined {
  if (!payload.sessionSignerAddress && !payload.sessionSignerValidUntil) {
    return undefined;
  }

  if (!payload.sessionSignerAddress || !/^0x[a-fA-F0-9]{40}$/.test(payload.sessionSignerAddress)) {
    return "sessionSignerAddress must be a valid EVM address.";
  }

  if (!payload.sessionSignerValidUntil) {
    return "sessionSignerValidUntil is required when authorizing a Quick Bid session signer.";
  }

  return validateSessionSignerExpiry(payload.sessionSignerValidUntil);
}

function validateSessionSignerExpiry(value: string): string | undefined {
  if (!/^\d+$/.test(value)) {
    return "sessionSignerValidUntil must be a unix timestamp.";
  }

  const parsed = Number(value);
  const now = Math.floor(Date.now() / 1000);

  if (!Number.isSafeInteger(parsed) || parsed <= now + 60) {
    return "sessionSignerValidUntil must be at least 60 seconds in the future.";
  }

  if (parsed > now + MAX_SESSION_SIGNER_VALIDITY_SECONDS) {
    return "Quick Bid session signer authorization cannot exceed 30 days.";
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

  if (
    submittedApproval.message.wallet.toLowerCase() !== submittedApproval.walletAddress.toLowerCase() ||
    submittedApproval.message.nonce !== submittedApproval.nonce ||
    submittedApproval.message.deadline !== submittedApproval.deadline ||
    normalizeApprovalCalls(submittedApproval.message.calls) !== normalizeApprovalCalls(submittedApproval.calls)
  ) {
    return "Signed approval message does not match approval payload. Refresh and approve trading again.";
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
