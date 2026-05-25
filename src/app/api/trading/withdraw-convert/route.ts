import { NextResponse } from "next/server";
import { recoverTypedDataAddress } from "viem";

import { POLYMARKET_USD } from "@/config/funding";
import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { fetchEvmTokenBalances } from "@/lib/funding/evm-balances";
import { selectFundingTokenBalance } from "@/lib/funding/balance-selectors";
import {
  buildPusdUnwrapToUsdceBatch,
  buildUsdceToUsdcConvertBatch,
  POLYGON_USDC_BRIDGED,
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

type WithdrawConvertPhase = "pusd-to-usdce" | "usdce-to-usdc";

interface ConvertSubmitPayload {
  signature?: string;
  transfer?: DepositWalletBatchSignablePayload;
}

const POLYGON_PUSD_TOKEN = {
  ...FUNDING_NETWORKS.polygon,
  symbol: POLYMARKET_USD.symbol,
  address: POLYMARKET_USD.address,
  decimals: POLYMARKET_USD.decimals,
  icon: POLYMARKET_USD.icon,
};

const POLYGON_USDCE_TOKEN = {
  ...FUNDING_NETWORKS.polygon,
  symbol: "USDC.e",
  address: POLYGON_USDC_BRIDGED,
  decimals: 6,
  icon: "/tokens/usdc.png",
};

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
  const transactionId = url.searchParams.get("transactionId")?.trim();
  const phase = url.searchParams.get("phase") as WithdrawConvertPhase | null;
  const amount = url.searchParams.get("amount")?.trim();
  const swapRecipient = url.searchParams.get("swapRecipient")?.trim();

  try {
    if (transactionId) {
      if (!/^[A-Za-z0-9_-]+$/.test(transactionId)) {
        return NextResponse.json({ error: "transactionId is invalid." }, { status: 400 });
      }

      return NextResponse.json({
        transaction: await fetchRelayerTransaction(transactionId),
      });
    }

    if (!phase || (phase !== "pusd-to-usdce" && phase !== "usdce-to-usdc")) {
      return NextResponse.json({ error: "phase must be pusd-to-usdce or usdce-to-usdc." }, { status: 400 });
    }

    const requestedBaseUnits = parseAmountBaseUnits(amount);

    if (requestedBaseUnits === undefined || requestedBaseUnits <= 0n) {
      return NextResponse.json({ error: "amount must be a positive USDC value." }, { status: 400 });
    }

    if (phase === "usdce-to-usdc") {
      if (!swapRecipient || !/^0x[a-fA-F0-9]{40}$/.test(swapRecipient)) {
        return NextResponse.json({ error: "swapRecipient must be a valid EVM address for usdce-to-usdc." }, { status: 400 });
      }
    }

    const amountBaseUnits = await capWithdrawAmountToFunderBalance(
      record.session.funderAddress,
      phase,
      requestedBaseUnits,
    );

    const tradingChainId = getTradingChainId();
    const nonce = await fetchRelayerNonce(record.session.walletAddress);
    const deadline = Math.floor(Date.now() / 1000 + 900).toString();
    const batchParams = {
      chainId: tradingChainId,
      walletAddress: record.session.funderAddress,
      nonce,
      deadline,
      amountBaseUnits,
    };

    const transfer =
      phase === "pusd-to-usdce"
        ? buildPusdUnwrapToUsdceBatch(batchParams)
        : buildUsdceToUsdcConvertBatch({
            ...batchParams,
            swapRecipient: swapRecipient!,
          });

    return NextResponse.json({
      funderAddress: record.session.funderAddress,
      phase,
      transfer,
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

  const payload = (await request.json()) as ConvertSubmitPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const submittedTransfer = payload.transfer!;

  if (submittedTransfer.message.wallet.toLowerCase() !== record.session.funderAddress.toLowerCase()) {
    return NextResponse.json({ error: "Signed withdraw wallet does not match the session deposit wallet." }, { status: 409 });
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
          error: `Withdraw signature recovered ${recoveredAddress}, which does not match connected wallet ${record.session.walletAddress}.`,
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
    const response = await submitRelayerTransaction(requestBody, "Unable to submit deposit wallet withdraw batch");

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

function validatePayload(payload: ConvertSubmitPayload): string | undefined {
  if (!payload.signature || !/^0x[a-fA-F0-9]+$/.test(payload.signature)) {
    return "signature is required.";
  }

  if (!payload.transfer?.message?.wallet) {
    return "transfer payload is required.";
  }

  return undefined;
}

function parseAmountBaseUnits(amount: string | null | undefined): bigint | undefined {
  if (!amount) {
    return undefined;
  }

  const normalized = amount.trim().replace(/,/g, "");

  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) {
    return undefined;
  }

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = `${fraction}000000`.slice(0, 6);

  try {
    return BigInt(`${whole}${paddedFraction}`);
  } catch {
    return undefined;
  }
}

async function capWithdrawAmountToFunderBalance(
  funderAddress: string,
  phase: WithdrawConvertPhase,
  requestedBaseUnits: bigint,
): Promise<bigint> {
  const token = phase === "pusd-to-usdce" ? POLYGON_PUSD_TOKEN : POLYGON_USDCE_TOKEN;
  const byChain = await fetchEvmTokenBalances(funderAddress, [token]);
  const balance = selectFundingTokenBalance(byChain, token);
  const available = BigInt(parseBalanceToBaseUnits(balance, token.decimals));

  if (available === 0n) {
    throw new Error(`Deposit wallet has no ${token.symbol} available for withdrawal conversion.`);
  }

  return requestedBaseUnits > available ? available : requestedBaseUnits;
}

function parseBalanceToBaseUnits(balance: string, decimals: number): string {
  const normalized = balance.trim();

  if (!normalized || normalized === "0") {
    return "0";
  }

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);

  return BigInt(`${whole}${paddedFraction}`).toString();
}
