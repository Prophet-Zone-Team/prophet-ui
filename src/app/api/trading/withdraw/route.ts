import { NextResponse } from "next/server";
import { recoverTypedDataAddress } from "viem";

import {
  buildWithdrawTransferBatch,
  requiresWithdrawQuoteId,
  resolveWithdrawBatchStrategy,
  type DepositWalletBatchSignablePayload,
} from "@/lib/market/deposit-wallet-batch";
import { getTradingChainId } from "@/server/trading/clob-auth";
import {
  createBridgeWithdrawalAddresses,
  fetchBridgeTransactionStatus,
} from "@/server/trading/bridge";
import {
  buildDepositWalletBatchRequest,
  fetchRelayerNonce,
  submitRelayerTransaction,
} from "@/server/trading/deposit-wallet";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WithdrawSubmitPayload {
  signature?: string;
  nonce?: string;
  deadline?: string;
  transfer?: DepositWalletBatchSignablePayload;
}

const COLLATERAL_DECIMALS = 6;

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
        error: "Deposit wallet must be deployed before withdrawals can be prepared.",
        status: record.session.depositWalletStatus ?? "unknown",
      },
      { status: 409 },
    );
  }

  const url = new URL(request.url);
  const statusAddress = url.searchParams.get("statusAddress");

  try {
    if (statusAddress) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(statusAddress)) {
        return NextResponse.json({ error: "statusAddress must be an EVM address." }, { status: 400 });
      }

      return NextResponse.json({
        status: await fetchBridgeTransactionStatus(statusAddress),
      });
    }

    const toChainId = url.searchParams.get("toChainId")?.trim();
    const toTokenAddress = url.searchParams.get("toTokenAddress")?.trim();
    const recipientAddr = url.searchParams.get("recipientAddr")?.trim();
    const amount = url.searchParams.get("amount")?.trim();
    const quoteId = url.searchParams.get("quoteId")?.trim();

    if (!toChainId || !toTokenAddress || !recipientAddr || !amount) {
      return NextResponse.json(
        { error: "toChainId, toTokenAddress, recipientAddr, and amount are required to prepare a withdrawal." },
        { status: 400 },
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(toTokenAddress) || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddr)) {
      return NextResponse.json({ error: "toTokenAddress and recipientAddr must be EVM addresses." }, { status: 400 });
    }

    const amountBaseUnits = parseUsdAmountToBaseUnits(amount);

    if (amountBaseUnits === undefined) {
      return NextResponse.json({ error: "amount must be a positive USDC value." }, { status: 400 });
    }

    const withdrawal = await createBridgeWithdrawalAddresses({
      address: record.session.funderAddress,
      toChainId,
      toTokenAddress,
      recipientAddr,
    });
    const bridgeRecipient = withdrawal.address.evm;

    if (!bridgeRecipient || !/^0x[a-fA-F0-9]{40}$/.test(bridgeRecipient)) {
      return NextResponse.json({ error: "Bridge did not return a valid EVM withdrawal address." }, { status: 502 });
    }

    const tradingChainId = getTradingChainId();

    if (
      requiresWithdrawQuoteId({ tradingChainId, toChainId, toTokenAddress }) &&
      !quoteId
    ) {
      return NextResponse.json(
        { error: "quoteId is required to prepare a same-chain USDC withdrawal." },
        { status: 400 },
      );
    }

    let strategy;

    try {
      strategy = resolveWithdrawBatchStrategy({
        tradingChainId,
        toChainId,
        toTokenAddress,
        bridgeRecipient,
        quoteId,
      });
    } catch (strategyError) {
      return NextResponse.json(
        {
          error: strategyError instanceof Error ? strategyError.message : String(strategyError),
        },
        { status: 400 },
      );
    }

    const nonce = await fetchRelayerNonce(record.session.walletAddress);
    const deadline = Math.floor(Date.now() / 1000 + 900).toString();

    return NextResponse.json({
      withdrawal,
      funderAddress: record.session.funderAddress,
      transfer: buildWithdrawTransferBatch({
        chainId: tradingChainId,
        walletAddress: record.session.funderAddress,
        nonce,
        deadline,
        amountBaseUnits,
        strategy,
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
        error: "Deposit wallet must be deployed before withdrawals can be submitted.",
        status: record.session.depositWalletStatus ?? "unknown",
      },
      { status: 409 },
    );
  }

  const payload = (await request.json()) as WithdrawSubmitPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const submittedTransfer = payload.transfer;

  if (!submittedTransfer) {
    return NextResponse.json({ error: "Missing signed withdrawal transfer payload." }, { status: 400 });
  }

  if (submittedTransfer.message.wallet.toLowerCase() !== record.session.funderAddress.toLowerCase()) {
    return NextResponse.json({ error: "Signed withdrawal wallet does not match the session deposit wallet." }, { status: 409 });
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
          error: `Withdrawal signature recovered ${recoveredAddress}, which does not match connected wallet ${record.session.walletAddress}.`,
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
    const response = await submitRelayerTransaction(requestBody, "Unable to submit deposit wallet withdrawal transfer");

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

function validatePayload(payload: WithdrawSubmitPayload): string | undefined {
  if (!payload.signature || !/^0x[a-fA-F0-9]+$/.test(payload.signature)) {
    return "Missing or invalid withdrawal batch signature.";
  }

  if (!payload.nonce || !/^\d+$/.test(payload.nonce)) {
    return "Missing or invalid withdrawal nonce.";
  }

  if (!payload.deadline || !/^\d+$/.test(payload.deadline)) {
    return "Missing or invalid withdrawal deadline.";
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
