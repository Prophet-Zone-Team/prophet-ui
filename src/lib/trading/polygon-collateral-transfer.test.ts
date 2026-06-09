import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseUnits, type Hex } from "viem";

import { NATIVE_FUNDING_TOKEN_ADDRESS } from "@/lib/funding/evm-balances";

import {
  transferCollateralWithWalletClient,
  type CollateralTransferWalletClient,
} from "./polygon-collateral-transfer";

const MOCK_TX_HASH = `0x${"a".repeat(64)}` as Hex;
const ERC20_USDC_ARBITRUM = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const BRIDGE_DEPOSIT_ADDRESS = "0x1234567890123456789012345678901234567890";

const baseParams = {
  toAddress: BRIDGE_DEPOSIT_ADDRESS,
  amountUsd: "0.01",
  tokenDecimals: 18,
};

function createMockWalletClient(): CollateralTransferWalletClient & {
  sendTransactionCalls: Array<{ to: string; value: bigint }>;
  writeContractCalls: Array<{
    address: string;
    functionName: string;
    args: readonly [string, bigint];
  }>;
} {
  const sendTransactionCalls: Array<{ to: string; value: bigint }> = [];
  const writeContractCalls: Array<{
    address: string;
    functionName: string;
    args: readonly [string, bigint];
  }> = [];

  return {
    sendTransactionCalls,
    writeContractCalls,
    async sendTransaction(request) {
      sendTransactionCalls.push({ to: request.to, value: request.value });
      return MOCK_TX_HASH;
    },
    async writeContract(request) {
      writeContractCalls.push({
        address: request.address,
        functionName: request.functionName,
        args: request.args,
      });
      return MOCK_TX_HASH;
    },
  };
}

describe("transferCollateralWithWalletClient", () => {
  it("sends native tokens via sendTransaction with parsed value", async () => {
    const walletClient = createMockWalletClient();

    const result = await transferCollateralWithWalletClient(walletClient, {
      ...baseParams,
      tokenAddress: NATIVE_FUNDING_TOKEN_ADDRESS,
    });

    assert.equal(result.txHash, MOCK_TX_HASH);
    assert.equal(walletClient.sendTransactionCalls.length, 1);
    assert.equal(walletClient.writeContractCalls.length, 0);
    assert.equal(walletClient.sendTransactionCalls[0].to, BRIDGE_DEPOSIT_ADDRESS);
    assert.equal(walletClient.sendTransactionCalls[0].value, parseUnits("0.01", 18));
  });

  it("sends ERC20 tokens via writeContract transfer", async () => {
    const walletClient = createMockWalletClient();

    const result = await transferCollateralWithWalletClient(walletClient, {
      ...baseParams,
      tokenAddress: ERC20_USDC_ARBITRUM,
      tokenDecimals: 6,
    });

    assert.equal(result.txHash, MOCK_TX_HASH);
    assert.equal(walletClient.writeContractCalls.length, 1);
    assert.equal(walletClient.sendTransactionCalls.length, 0);
    assert.equal(walletClient.writeContractCalls[0].address, ERC20_USDC_ARBITRUM);
    assert.equal(walletClient.writeContractCalls[0].functionName, "transfer");
    assert.deepEqual(walletClient.writeContractCalls[0].args, [
      BRIDGE_DEPOSIT_ADDRESS,
      parseUnits("0.01", 6),
    ]);
  });

  it("rejects zero amount before calling the wallet", async () => {
    const walletClient = createMockWalletClient();

    await assert.rejects(
      () =>
        transferCollateralWithWalletClient(walletClient, {
          ...baseParams,
          tokenAddress: NATIVE_FUNDING_TOKEN_ADDRESS,
          amountUsd: "0",
        }),
      /greater than zero/,
    );

    await assert.rejects(
      () =>
        transferCollateralWithWalletClient(walletClient, {
          ...baseParams,
          tokenAddress: ERC20_USDC_ARBITRUM,
          amountUsd: "0",
        }),
      /greater than zero/,
    );

    assert.equal(walletClient.sendTransactionCalls.length, 0);
    assert.equal(walletClient.writeContractCalls.length, 0);
  });
});
