import { providers } from "near-api-js";

import { NEAR_NETWORK } from "./near-config";

let cachedProvider: providers.JsonRpcProvider | undefined;

function getProvider(): providers.JsonRpcProvider {
  if (!cachedProvider) {
    cachedProvider = new providers.JsonRpcProvider({ url: NEAR_NETWORK.nodeUrl });
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

  const response = (await getProvider().query({
    request_type: "call_function",
    account_id: params.contractId,
    method_name: params.methodName,
    args_base64: argsBase64,
    finality: "optimistic",
  })) as { result: number[] };

  const raw = Buffer.from(response.result).toString("utf-8");

  return JSON.parse(raw) as TResult;
}
