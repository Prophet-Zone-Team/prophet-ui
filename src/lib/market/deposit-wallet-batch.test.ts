import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeFunctionData, getAddress } from "viem";

import { POLYGON_USDC_NATIVE } from "@/lib/funding/stableflow";

import { POLYMARKET_USD } from "../../config/funding";
import { POLYGON_COLLATERAL_CONTRACTS } from "./polymarket-collateral-contracts";
import {
  buildPusdUnwrapToUsdceBatch,
  buildTradingApprovalBatch,
  buildUsdceToUsdcConvertBatch,
  buildWithdrawTransferBatch,
  POLYGON_USDC_BRIDGED,
  resolveBridgeWithdrawDepositAddress,
  UNISWAP_V3_ROUTER,
} from "./deposit-wallet-batch";

const ERC1155_SET_APPROVAL_FOR_ALL_ABI = [
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

const TRADING_APPROVAL_CONTRACTS = {
  collateralToken: "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB",
  conditionalTokens: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045",
  exchange: "0xE111180000d2663C0091e4f400237545B87B996B",
  negRiskExchange: "0xe2222d279d744050d28e00520010520000310F59",
  negRiskAdapter: "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296",
  ctfCollateralAdapter: POLYGON_COLLATERAL_CONTRACTS.ctfCollateralAdapter,
  negRiskCtfCollateralAdapter: POLYGON_COLLATERAL_CONTRACTS.negRiskCtfCollateralAdapter,
};

const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const UNISWAP_EXACT_INPUT_SINGLE_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

const OFFRAMP_UNWRAP_ABI = [
  {
    name: "unwrap",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collateralToken", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

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

describe("buildTradingApprovalBatch", () => {
  it("includes ERC20 and ERC1155 approvals for negRiskAdapter", () => {
    const walletAddress = "0x9156dd10bea4c8d7e2d591b633d1694b1d764756";

    const batch = buildTradingApprovalBatch({
      chainId: 137,
      walletAddress,
      nonce: "0",
      deadline: "9999999999",
      ...TRADING_APPROVAL_CONTRACTS,
    });

    assert.equal(batch.message.calls.length, 9);

    const erc20Approves = batch.message.calls
      .filter((call) => getAddress(call.target) === getAddress(TRADING_APPROVAL_CONTRACTS.collateralToken))
      .map((call) =>
        decodeFunctionData({
          abi: ERC20_APPROVE_ABI,
          data: call.data,
        }),
      );

    assert.equal(erc20Approves.length, 4);
    assert.ok(
      erc20Approves.some(
        (decoded) => getAddress(decoded.args[0]) === getAddress(TRADING_APPROVAL_CONTRACTS.negRiskAdapter),
      ),
    );

    const erc1155Approves = batch.message.calls
      .filter((call) => getAddress(call.target) === getAddress(TRADING_APPROVAL_CONTRACTS.conditionalTokens))
      .map((call) =>
        decodeFunctionData({
          abi: ERC1155_SET_APPROVAL_FOR_ALL_ABI,
          data: call.data,
        }),
      );

    assert.equal(erc1155Approves.length, 5);
    assert.ok(
      erc1155Approves.some(
        (decoded) => getAddress(decoded.args[0]) === getAddress(TRADING_APPROVAL_CONTRACTS.negRiskAdapter),
      ),
    );
    assert.ok(
      erc1155Approves.some(
        (decoded) =>
          getAddress(decoded.args[0]) === getAddress(TRADING_APPROVAL_CONTRACTS.ctfCollateralAdapter),
      ),
    );
    assert.ok(
      erc1155Approves.some(
        (decoded) =>
          getAddress(decoded.args[0]) ===
          getAddress(TRADING_APPROVAL_CONTRACTS.negRiskCtfCollateralAdapter),
      ),
    );
    assert.equal(erc1155Approves.find(
      (decoded) => getAddress(decoded.args[0]) === getAddress(TRADING_APPROVAL_CONTRACTS.negRiskAdapter),
    )?.args[1], true);
  });
});

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

describe("buildPusdUnwrapToUsdceBatch", () => {
  it("approves pUSD for offramp then unwraps to USDC.e on the deposit wallet", () => {
    const walletAddress = "0x9156dd10bea4c8d7e2d591b633d1694b1d764756";
    const amountBaseUnits = 3_000_000n;

    const batch = buildPusdUnwrapToUsdceBatch({
      chainId: 137,
      walletAddress,
      nonce: "15",
      deadline: "9999999999",
      amountBaseUnits,
    });

    assert.equal(batch.message.calls.length, 2);

    const approveCall = batch.message.calls[0];
    assert.equal(getAddress(approveCall.target), getAddress(POLYMARKET_USD.address));

    const approveDecoded = decodeFunctionData({
      abi: ERC20_APPROVE_ABI,
      data: approveCall.data,
    });
    assert.equal(getAddress(approveDecoded.args[0]), getAddress(POLYGON_COLLATERAL_CONTRACTS.offramp));
    assert.equal(approveDecoded.args[1], amountBaseUnits);

    const unwrapCall = batch.message.calls[1];
    assert.equal(getAddress(unwrapCall.target), getAddress(POLYGON_COLLATERAL_CONTRACTS.offramp));

    const unwrapDecoded = decodeFunctionData({
      abi: OFFRAMP_UNWRAP_ABI,
      data: unwrapCall.data,
    });
    assert.equal(getAddress(unwrapDecoded.args[0]), getAddress(POLYGON_USDC_BRIDGED));
    assert.equal(getAddress(unwrapDecoded.args[1]), getAddress(walletAddress));
    assert.equal(unwrapDecoded.args[2], amountBaseUnits);
  });
});

describe("buildUsdceToUsdcConvertBatch", () => {
  it("approves USDC.e for Uniswap router and swaps to native USDC for swapRecipient", () => {
    const walletAddress = "0x9156dd10bea4c8d7e2d591b633d1694b1d764756";
    const swapRecipient = "0x23566f8b2E82aDfCf01846E54899d110e97AC053";
    const amountBaseUnits = 3_000_000n;

    const batch = buildUsdceToUsdcConvertBatch({
      chainId: 137,
      walletAddress,
      nonce: "16",
      deadline: "9999999999",
      amountBaseUnits,
      swapRecipient,
    });

    assert.equal(batch.message.calls.length, 2);

    const approveCall = batch.message.calls[0];
    assert.equal(getAddress(approveCall.target), getAddress(POLYGON_USDC_BRIDGED));

    const approveDecoded = decodeFunctionData({
      abi: ERC20_APPROVE_ABI,
      data: approveCall.data,
    });
    assert.equal(getAddress(approveDecoded.args[0]), getAddress(UNISWAP_V3_ROUTER));
    assert.equal(approveDecoded.args[1], amountBaseUnits);

    const swapCall = batch.message.calls[1];
    assert.equal(getAddress(swapCall.target), getAddress(UNISWAP_V3_ROUTER));

    const swapDecoded = decodeFunctionData({
      abi: UNISWAP_EXACT_INPUT_SINGLE_ABI,
      data: swapCall.data,
    });
    assert.equal(getAddress(swapDecoded.args[0].tokenIn), getAddress(POLYGON_USDC_BRIDGED));
    assert.equal(getAddress(swapDecoded.args[0].tokenOut), getAddress(POLYGON_USDC_NATIVE));
    assert.equal(getAddress(swapDecoded.args[0].recipient), getAddress(swapRecipient));
    assert.equal(swapDecoded.args[0].amountIn, amountBaseUnits);
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
