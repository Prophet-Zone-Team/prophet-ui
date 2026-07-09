import { NextResponse } from "next/server";
import { recoverTypedDataAddress } from "viem";

import {
  buildWithdrawTransferBatch,
  type DepositWalletBatchSignablePayload,
} from "@/lib/market/deposit-wallet-batch";
import { getTradingChainId } from "@/server/trading/clob-auth";
import {
  buildDepositWalletBatchRequest,
  fetchRelayerNonce,
  fetchRelayerTransaction,
  submitRelayerTransaction,
} from "@/server/trading/deposit-wallet";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CopyTradeDepositSubmitPayload {
  signature?: string;
  nonce?: string;
  deadline?: string;
  transfer?: DepositWalletBatchSignablePayload;
}

const COLLATERAL_DECIMALS = 6;
const EVM_RECIPIENT_PATTERN = /^0x[a-fA-F0-9]{40}$/;

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
        error: "Deposit wallet must be deployed before a copy-trade deposit can be prepared.",
        status: record.session.depositWalletStatus ?? "unknown",
      },
      { status: 409 },
    );
  }

  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId")?.trim();

  try {
    if (transactionId) {
      if (!/^[A-Za-z0-9_-]+$/.test(transactionId)) {
        return NextResponse.json({ error: "transactionId is invalid." }, { status: 400 });
      }

      return NextResponse.json({
        transaction: await fetchRelayerTransaction(transactionId),
      });
    }

    const recipient = url.searchParams.get("recipient")?.trim();
    const amount = url.searchParams.get("amount")?.trim();

    if (!recipient || !amount) {
      return NextResponse.json(
        { error: "recipient and amount are required to prepare a copy-trade deposit." },
        { status: 400 },
      );
    }

    if (!EVM_RECIPIENT_PATTERN.test(recipient)) {
      return NextResponse.json({ error: "recipient must be a valid EVM address." }, { status: 400 });
    }

    const amountBaseUnits = parseUsdAmountToBaseUnits(amount);

    if (amountBaseUnits === undefined) {
      return NextResponse.json({ error: "amount must be a positive USDC value." }, { status: 400 });
    }

    const tradingChainId = getTradingChainId();
    const nonce = await fetchRelayerNonce(record.session.walletAddress);
    const deadline = Math.floor(Date.now() / 1000 + 900).toString();

    return NextResponse.json({
      funderAddress: record.session.funderAddress,
      recipient,
      transfer: buildWithdrawTransferBatch({
        chainId: tradingChainId,
        walletAddress: record.session.funderAddress,
        nonce,
        deadline,
        amountBaseUnits,
        bridgeRecipient: recipient,
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
        error: "Deposit wallet must be deployed before a copy-trade deposit can be submitted.",
        status: record.session.depositWalletStatus ?? "unknown",
      },
      { status: 409 },
    );
  }

  const payload = (await request.json()) as CopyTradeDepositSubmitPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const submittedTransfer = payload.transfer;

  if (!submittedTransfer) {
    return NextResponse.json({ error: "Missing signed copy-trade deposit transfer payload." }, { status: 400 });
  }

  if (submittedTransfer.message.wallet.toLowerCase() !== record.session.funderAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Signed transfer wallet does not match the session deposit wallet." },
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
          error: `Transfer signature recovered ${recoveredAddress}, which does not match connected wallet ${record.session.walletAddress}.`,
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
    const response = await submitRelayerTransaction(
      requestBody,
      "Unable to submit deposit wallet copy-trade transfer",
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

function validatePayload(payload: CopyTradeDepositSubmitPayload): string | undefined {
  if (!payload.signature || !/^0x[a-fA-F0-9]+$/.test(payload.signature)) {
    return "Missing or invalid transfer batch signature.";
  }

  if (!payload.nonce || !/^\d+$/.test(payload.nonce)) {
    return "Missing or invalid transfer nonce.";
  }

  if (!payload.deadline || !/^\d+$/.test(payload.deadline)) {
    return "Missing or invalid transfer deadline.";
  }

  return undefined;
}

function parseUsdAmountToBaseUnits(value: string): bigint | undefined {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return BigInt(Math.round(parsed * 10 ** COLLATERAL_DECIMALS));
}
