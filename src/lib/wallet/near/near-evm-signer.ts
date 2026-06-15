import {
  createWalletClient,
  hashMessage,
  hashTypedData,
  http,
  type Address,
  type Hash,
  type SignableMessage,
  type TypedDataDefinition,
  type WalletClient,
} from "viem";
import { toAccount } from "viem/accounts";

import { getFundingEvmChain } from "@/config/funding/evm-chains";
import { getFundingRpcUrl } from "@/config/funding/networks";
import { POLYGON_CHAIN_ID } from "@/lib/market/polymarket-collateral-contracts";
import type {
  ExternalEvmSigner,
  ExternalTypedDataPayload,
} from "@/lib/wallet/evm/external-signer-registry";

import { signDigestWithV1Signer } from "./v1-signer";

const SIGN_TRANSACTION_UNSUPPORTED =
  "Sending raw EVM transactions is not supported for NEAR-derived accounts. Use the cross-chain bridge for deposits and withdrawals.";

async function signDigest(
  digest: Hash,
  nearAccountId: string,
): Promise<`0x${string}`> {
  const { evmSignature } = await signDigestWithV1Signer(digest, nearAccountId);
  return evmSignature;
}

function resolveTransport(chainId: number) {
  try {
    return http(getFundingRpcUrl(chainId));
  } catch {
    return http();
  }
}

/**
 * Builds an ExternalEvmSigner whose signatures are produced by the NEAR MPC
 * (v1.signer) contract. The owner EVM address is derived deterministically
 * from the NEAR account; signatures cover EIP-191 personal_sign, EIP-712 typed
 * data, and the Polymarket order signing path (via a viem custom account).
 */
export function createNearEvmSigner(params: {
  address: string;
  nearAccountId: string;
}): ExternalEvmSigner {
  const { address, nearAccountId } = params;

  const signMessage = (message: string): Promise<`0x${string}`> =>
    signDigest(hashMessage(message), nearAccountId);

  const signTypedData = (
    payload: ExternalTypedDataPayload,
  ): Promise<string> =>
    signDigest(
      hashTypedData(payload as unknown as TypedDataDefinition),
      nearAccountId,
    );

  const getWalletClient = async (
    chainId?: number,
  ): Promise<WalletClient> => {
    const resolvedChainId = chainId ?? POLYGON_CHAIN_ID;
    const chain = getFundingEvmChain(resolvedChainId);

    const account = toAccount({
      address: address as Address,
      async signMessage({ message }: { message: SignableMessage }) {
        return signDigest(hashMessage(message), nearAccountId);
      },
      async signTypedData(typedData) {
        return signDigest(
          hashTypedData(typedData as TypedDataDefinition),
          nearAccountId,
        );
      },
      async signTransaction() {
        throw new Error(SIGN_TRANSACTION_UNSUPPORTED);
      },
    });

    return createWalletClient({
      account,
      chain,
      transport: resolveTransport(resolvedChainId),
    });
  };

  return {
    address,
    signMessage,
    signTypedData,
    getWalletClient,
  };
}
