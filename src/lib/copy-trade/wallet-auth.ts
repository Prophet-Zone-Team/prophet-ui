import type { AxiosRequestConfig, Method } from "axios";

import { signEvmMessage } from "@/lib/wallet/evm/evm-adapter";
import { copyTradeRequest } from "@/service/copy-trade/client";

interface WalletAuthMessageResponse {
  message: string;
  nonce: string;
  timestamp: number;
}

function normalizeWalletAddress(address: string): string {
  return address.trim().toLowerCase();
}

export async function buildCopyTradeSignedRequestConfig(
  walletAddress: string,
  method: Method,
  path: string,
  body?: unknown,
): Promise<AxiosRequestConfig> {
  const account = normalizeWalletAddress(walletAddress);
  if (!account) {
    throw new Error("Wallet address is required.");
  }

  const upperMethod = String(method).toUpperCase();
  const bodyText = body === undefined ? "" : JSON.stringify(body);

  const auth = await copyTradeRequest<WalletAuthMessageResponse>(
    "POST",
    "/wallet-auth/message",
    {
      method: upperMethod,
      path,
      wallet_address: account,
      body: bodyText,
    },
  );

  const signature = await signEvmMessage(account, auth.message);

  const headers: Record<string, string> = {
    "X-Wallet-Address": account,
    "X-Wallet-Nonce": auth.nonce,
    "X-Wallet-Timestamp": String(auth.timestamp),
    "X-Wallet-Signature": signature,
  };

  if (bodyText) {
    headers["Content-Type"] = "application/json";
  }

  return { headers };
}
