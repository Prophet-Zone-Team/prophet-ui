import { NextResponse } from "next/server";

import {
  checkDepositWalletForOwner,
  setupDepositWalletForOwner,
} from "@/server/trading/deposit-wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEPOSIT_WALLET_CHECK_FAILED_ERROR =
  "Deposit wallet check failed. Click Connect Wallet to retry.";

interface DeployDepositWalletPayload {
  walletAddress?: string;
}

export async function GET(request: Request) {
  try {
    const walletAddress = new URL(request.url).searchParams.get("walletAddress")?.trim();
    const validationError = validateWalletAddress(walletAddress);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const depositWallet = await checkDepositWalletForOwner(walletAddress!);

    return NextResponse.json(depositWallet);
  } catch (error) {
    console.error("[deposit-wallet] GET failed", error);

    return NextResponse.json({ error: DEPOSIT_WALLET_CHECK_FAILED_ERROR }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseDeployPayload(request);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const validationError = validateWalletAddress(payload.walletAddress?.trim());

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const depositWallet = await setupDepositWalletForOwner(payload.walletAddress!.trim());

    return NextResponse.json({
      walletAddress: depositWallet.walletAddress,
      status: depositWallet.status,
      checkedAt: depositWallet.checkedAt,
      transactionId: depositWallet.transactionId,
      transactionHash: depositWallet.transactionHash,
      error: depositWallet.error,
    });
  } catch (error) {
    console.error("[deposit-wallet] POST failed", error);

    return NextResponse.json({ error: DEPOSIT_WALLET_CHECK_FAILED_ERROR }, { status: 500 });
  }
}

async function parseDeployPayload(
  request: Request,
): Promise<DeployDepositWalletPayload | NextResponse> {
  try {
    return (await request.json()) as DeployDepositWalletPayload;
  } catch (error) {
    console.error("[deposit-wallet] POST payload parse failed", error);

    return NextResponse.json({ error: DEPOSIT_WALLET_CHECK_FAILED_ERROR }, { status: 400 });
  }
}

function validateWalletAddress(walletAddress: string | undefined) {
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return "walletAddress must be a valid EVM address.";
  }

  return undefined;
}
