import { TronWeb } from "tronweb";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { generateRpcSignature } from "@/config/funding/signature";

export function createTronWeb(address?: string): TronWeb {
  const rpcUrl = FUNDING_NETWORKS.tron.rpcUrls[0] ?? FUNDING_NETWORKS.tron.defaultRpcUrl;
  const { headers } = generateRpcSignature("tron");
  const tronWeb = new TronWeb({
    fullHost: rpcUrl,
    headers,
    privateKey: "",
  });

  if (address) {
    tronWeb.setAddress(address);
  }

  return tronWeb;
}
