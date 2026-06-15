import { providers } from "near-api-js";
import type { CodeResult } from "near-api-js/lib/providers/provider";

import { FUNDING_NETWORKS } from "@/config/funding";

let cachedProvider: providers.JsonRpcProvider | undefined;

function getProvider(): providers.JsonRpcProvider {
  if (!cachedProvider) {
    cachedProvider = new providers.JsonRpcProvider({ url: FUNDING_NETWORKS.near.defaultRpcUrl });
  }

  return cachedProvider;
}

/**
 * Read-only NEAR contract view call. Does not require a connected wallet, so it
 * can be used to derive the MPC public key before the user signs anything.
 */
export async function viewFunction<TResult = unknown>(params: {
  contractId: string;
  methodName: string;
  args?: Record<string, unknown>;
}): Promise<TResult> {
  const argsBase64 = Buffer.from(JSON.stringify(params.args ?? {})).toString(
    "base64",
  );

  const queryResponse = await getProvider().query({
    request_type: "call_function",
    account_id: params.contractId,
    method_name: params.methodName,
    args_base64: argsBase64,
    finality: "optimistic",
  });
  const response = queryResponse as unknown as CodeResult;

  const raw = Buffer.from(response.result).toString("utf-8");

  return JSON.parse(raw) as TResult;
}
