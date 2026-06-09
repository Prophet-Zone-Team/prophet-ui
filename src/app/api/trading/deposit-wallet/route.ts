import { NextResponse } from "next/server";

import {
  checkDepositWalletForOwner,
  setupDepositWalletForOwner,
} from "@/server/trading/deposit-wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DeployDepositWalletPayload {
  walletAddress?: string;
}

export async function GET(request: Request) {
  const walletAddress = new URL(request.url).searchParams.get("walletAddress")?.trim();
  const validationError = validateWalletAddress(walletAddress);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const depositWallet = await checkDepositWalletForOwner(walletAddress!);

  return NextResponse.json(depositWallet);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as DeployDepositWalletPayload;
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
}

function validateWalletAddress(walletAddress: string | undefined) {
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return "walletAddress must be a valid EVM address.";
  }

  return undefined;
}
