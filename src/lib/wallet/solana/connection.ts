import { Connection } from "@solana/web3.js";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { generateRpcSignature } from "@/config/funding/signature";

function buildConnection(rpcUrl: string): Connection {
  const isSignedRpc = rpcUrl.includes("rpcs.stableflow.ai");

  if (!isSignedRpc) {
    return new Connection(rpcUrl, "confirmed");
  }

  const { headers } = generateRpcSignature("solana");

  return new Connection(rpcUrl, {
    commitment: "confirmed",
    httpHeaders: headers,
  });
}

export function createSolanaFundingConnection(): Connection {
  const rpcUrls = FUNDING_NETWORKS.solana.rpcUrls;

  return buildConnection(rpcUrls[0] ?? FUNDING_NETWORKS.solana.defaultRpcUrl);
}
