import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeFunctionData, getAddress } from "viem";

import { POLYMARKET_USD } from "../../config/funding";
import {
  buildWithdrawTransferBatch,
  resolveBridgeWithdrawDepositAddress,
} from "./deposit-wallet-batch";

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

describe("buildWithdrawTransferBatch", () => {
  it("builds a single pUSD transfer call to the bridge deposit address", () => {
    const bridgeRecipient = "0x23566f8b2E82aDfCf01846E54899d110e97AC053";
    const amountBaseUnits = 1_000_000n;
    const walletAddress = "0x9156dd10bea4c8d7e2d591b633d1694b1d764756";

    const batch = buildWithdrawTransferBatch({
      chainId: 137,
      walletAddress,
      nonce: "0",
      deadline: "9999999999",
      amountBaseUnits,
      bridgeRecipient,
    });

    assert.equal(batch.message.calls.length, 1);

    const call = batch.message.calls[0];
    assert.equal(getAddress(call.target), getAddress(POLYMARKET_USD.address));
    assert.equal(call.value, "0");

    const decoded = decodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      data: call.data,
    });

    assert.equal(decoded.functionName, "transfer");
    assert.equal(getAddress(decoded.args[0]), getAddress(bridgeRecipient));
    assert.equal(decoded.args[1], amountBaseUnits);
  });
});

describe("resolveBridgeWithdrawDepositAddress", () => {
  it("returns the EVM withdrawal address by default", () => {
    const evmAddress = "0x23566f8b2E82aDfCf01846E54899d110e97AC053";

    assert.equal(
      resolveBridgeWithdrawDepositAddress({ evm: evmAddress }),
      evmAddress,
    );
  });

  it("throws when the EVM withdrawal address is missing", () => {
    assert.throws(
      () => resolveBridgeWithdrawDepositAddress({}),
      /valid EVM withdrawal address/,
    );
  });
});
