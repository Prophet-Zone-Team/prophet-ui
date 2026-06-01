import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeFunctionData, getAddress } from "viem";

import { POLYMARKET_USD } from "../../config/funding";
import { POLYGON_COLLATERAL_CONTRACTS } from "./polymarket-collateral-contracts";
import {
  buildRedeemBatch,
  createRedeemPositionsCall,
  resolveRedeemAdapterAddress,
} from "./redeem-batch";

const CONDITION_ID =
  "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917";
const CONDITIONAL_TOKENS = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";

const REDEEM_ABI = [
  {
    name: "redeemPositions",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "parentCollectionId", type: "bytes32" },
      { name: "conditionId", type: "bytes32" },
      { name: "indexSets", type: "uint256[]" },
    ],
    outputs: [],
  },
] as const;

const ERC1155_ABI = [
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
] as const;

describe("redeem-batch", () => {
  it("resolves adapter by negativeRisk flag", () => {
    assert.equal(
      resolveRedeemAdapterAddress(false),
      POLYGON_COLLATERAL_CONTRACTS.ctfCollateralAdapter,
    );
    assert.equal(
      resolveRedeemAdapterAddress(true),
      POLYGON_COLLATERAL_CONTRACTS.negRiskCtfCollateralAdapter,
    );
  });

  it("encodes standard-market redeemPositions on CtfCollateralAdapter", () => {
    const call = createRedeemPositionsCall({
      adapterAddress: POLYGON_COLLATERAL_CONTRACTS.ctfCollateralAdapter,
      collateralToken: POLYMARKET_USD.address,
      conditionId: CONDITION_ID,
    });

    assert.equal(
      getAddress(call.target),
      getAddress(POLYGON_COLLATERAL_CONTRACTS.ctfCollateralAdapter),
    );

    const decoded = decodeFunctionData({
      abi: REDEEM_ABI,
      data: call.data,
    });

    assert.equal(decoded.functionName, "redeemPositions");
    assert.equal(getAddress(decoded.args[0]), getAddress(POLYMARKET_USD.address));
    assert.equal(decoded.args[1], `0x${"0".repeat(64)}`);
    assert.equal(decoded.args[2], CONDITION_ID);
    assert.deepEqual(decoded.args[3], [1n, 2n]);
  });

  it("builds batch with optional adapter approval and redeem call", () => {
    const batch = buildRedeemBatch({
      chainId: 137,
      walletAddress: "0x1234567890123456789012345678901234567890",
      nonce: "0",
      deadline: "9999999999",
      conditionId: CONDITION_ID,
      negativeRisk: true,
      collateralToken: POLYMARKET_USD.address,
      conditionalTokens: CONDITIONAL_TOKENS,
      includeAdapterApproval: true,
    });

    assert.equal(batch.message.calls.length, 2);

    const approvalDecoded = decodeFunctionData({
      abi: ERC1155_ABI,
      data: batch.message.calls[0].data,
    });

    assert.equal(approvalDecoded.functionName, "setApprovalForAll");
    assert.equal(
      getAddress(approvalDecoded.args[0]),
      getAddress(POLYGON_COLLATERAL_CONTRACTS.negRiskCtfCollateralAdapter),
    );
    assert.equal(approvalDecoded.args[1], true);

    assert.equal(
      getAddress(batch.message.calls[1].target),
      getAddress(POLYGON_COLLATERAL_CONTRACTS.negRiskCtfCollateralAdapter),
    );
  });

  it("builds redeem-only batch when includeAdapterApproval is false", () => {
    const batch = buildRedeemBatch({
      chainId: 137,
      walletAddress: "0x1234567890123456789012345678901234567890",
      nonce: "1",
      deadline: "9999999999",
      conditionId: CONDITION_ID,
      negativeRisk: false,
      collateralToken: POLYMARKET_USD.address,
      conditionalTokens: CONDITIONAL_TOKENS,
      includeAdapterApproval: false,
    });

    assert.equal(batch.message.calls.length, 1);
    assert.equal(
      getAddress(batch.message.calls[0].target),
      getAddress(POLYGON_COLLATERAL_CONTRACTS.ctfCollateralAdapter),
    );
  });
});
