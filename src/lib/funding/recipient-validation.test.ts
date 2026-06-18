import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isValidBridgeRecipientAddress,
  isValidBridgeTokenAddress,
  isValidStableflowDepositTxHash,
} from "./recipient-validation";

const EVM_TX_HASH = `0x${"a".repeat(64)}`;
const TRON_TX_HASH = "a".repeat(64);
const NEAR_TX_HASH = "Au4Z3Y9NjTNjJBt8y6HrRfbRwiCvErWWawrD2DfFZAfC";
const SOLANA_TX_HASH =
  "5VERv8NMvzbJMEkVwxHy2vTjJ5hGcF4p4qQbXGKmWkPxY8NqzR3KjH5mN7pL9sT2vW6xZ4K5mN7pL9sT2vW6xZ";

const TRON_CHAIN_ID = "728126428";
const SOLANA_CHAIN_ID = "1151111081099710";
const POLYGON_CHAIN_ID = "137";

const TRON_USDT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const SOLANA_USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOLANA_NATIVE_SENTINEL = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const POLYGON_USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const EVM_RECIPIENT = "0x17eC161f126e82A8ba337f4022d574DBEaFef575";

describe("isValidBridgeTokenAddress", () => {
  it("accepts Tron USDT on Tron chain", () => {
    assert.equal(isValidBridgeTokenAddress(TRON_CHAIN_ID, TRON_USDT_ADDRESS), true);
  });

  it("accepts Solana USDC on Solana chain", () => {
    assert.equal(isValidBridgeTokenAddress(SOLANA_CHAIN_ID, SOLANA_USDC_ADDRESS), true);
  });

  it("accepts native sentinel on Solana chain", () => {
    assert.equal(isValidBridgeTokenAddress(SOLANA_CHAIN_ID, SOLANA_NATIVE_SENTINEL), true);
  });

  it("accepts Polygon USDC on Polygon chain", () => {
    assert.equal(isValidBridgeTokenAddress(POLYGON_CHAIN_ID, POLYGON_USDC_ADDRESS), true);
  });

  it("rejects Tron address on EVM chain", () => {
    assert.equal(isValidBridgeTokenAddress(POLYGON_CHAIN_ID, TRON_USDT_ADDRESS), false);
  });

  it("rejects EVM address on Tron chain", () => {
    assert.equal(isValidBridgeTokenAddress(TRON_CHAIN_ID, POLYGON_USDC_ADDRESS), false);
  });

  it("rejects empty and whitespace addresses", () => {
    assert.equal(isValidBridgeTokenAddress(TRON_CHAIN_ID, ""), false);
    assert.equal(isValidBridgeTokenAddress(TRON_CHAIN_ID, "   "), false);
  });
});

describe("isValidBridgeRecipientAddress", () => {
  it("accepts EVM recipient on Polygon chain", () => {
    assert.equal(isValidBridgeRecipientAddress(POLYGON_CHAIN_ID, EVM_RECIPIENT), true);
  });

  it("accepts Tron recipient on Tron chain", () => {
    assert.equal(isValidBridgeRecipientAddress(TRON_CHAIN_ID, TRON_USDT_ADDRESS), true);
  });

  it("accepts Solana recipient on Solana chain", () => {
    assert.equal(isValidBridgeRecipientAddress(SOLANA_CHAIN_ID, SOLANA_USDC_ADDRESS), true);
  });
});

describe("isValidStableflowDepositTxHash", () => {
  it("accepts EVM tx hashes with 0x prefix", () => {
    assert.equal(isValidStableflowDepositTxHash(EVM_TX_HASH), true);
  });

  it("accepts Tron 64-char hex tx hashes", () => {
    assert.equal(isValidStableflowDepositTxHash(TRON_TX_HASH), true);
  });

  it("accepts NEAR base58 tx hashes", () => {
    assert.equal(isValidStableflowDepositTxHash(NEAR_TX_HASH), true);
  });

  it("accepts long Solana base58 transaction signatures", () => {
    assert.equal(isValidStableflowDepositTxHash(SOLANA_TX_HASH), true);
  });

  it("trims whitespace before validating", () => {
    assert.equal(isValidStableflowDepositTxHash(`  ${NEAR_TX_HASH}  `), true);
  });

  it("rejects empty strings", () => {
    assert.equal(isValidStableflowDepositTxHash(""), false);
    assert.equal(isValidStableflowDepositTxHash("   "), false);
  });

  it("rejects tx hashes that are too short", () => {
    assert.equal(isValidStableflowDepositTxHash("abc123"), false);
  });

  it("rejects tx hashes that are too long", () => {
    assert.equal(isValidStableflowDepositTxHash("a".repeat(89)), false);
  });

  it("rejects tx hashes with special characters", () => {
    assert.equal(isValidStableflowDepositTxHash(`${NEAR_TX_HASH}!`), false);
    assert.equal(isValidStableflowDepositTxHash("0xGHIJKL"), false);
  });
});
