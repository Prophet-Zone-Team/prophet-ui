import { fetchJson } from "@/lib/team/client-fetch";
import type { DepositWalletCheckResponse, DepositWalletDeployResponse } from "@/types/market";

const DEPOSIT_WALLET_POLL_INTERVAL_MS = 2000;
const DEPOSIT_WALLET_POLL_MAX_MS = 120_000;

export async function fetchDepositWalletStatus(
  walletAddress: string,
): Promise<DepositWalletCheckResponse> {
  const params = new URLSearchParams({ walletAddress });
  const status = await fetchJson<DepositWalletCheckResponse>(
    `/api/trading/deposit-wallet?${params.toString()}`,
  );

  if (status.status === "error") {
    throw new Error(status.error ?? "Unable to check Polymarket deposit wallet deployment.");
  }

  return status;
}

export async function deployDepositWallet(
  walletAddress: string,
): Promise<DepositWalletDeployResponse> {
  return fetchJson<DepositWalletDeployResponse>("/api/trading/deposit-wallet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ walletAddress }),
  });
}

export async function pollDepositWalletUntilDeployed(walletAddress: string) {
  const startedAt = Date.now();

  while (true) {
    const status = await fetchDepositWalletStatus(walletAddress);

    if (status.deployed) {
      return status;
    }

    if (Date.now() - startedAt >= DEPOSIT_WALLET_POLL_MAX_MS) {
      throw new Error(
        "Deposit wallet deployment is still pending on the Polymarket relayer. Wait a minute and retry.",
      );
    }

    await delay(DEPOSIT_WALLET_POLL_INTERVAL_MS);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
