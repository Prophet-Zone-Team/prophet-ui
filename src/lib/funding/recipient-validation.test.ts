import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isValidStableflowDepositTxHash } from "./recipient-validation";

const EVM_TX_HASH = `0x${"a".repeat(64)}`;
const TRON_TX_HASH = "a".repeat(64);
const NEAR_TX_HASH = "Au4Z3Y9NjTNjJBt8y6HrRfbRwiCvErWWawrD2DfFZAfC";
const SOLANA_TX_HASH =
  "5VERv8NMvzbJMEkVwxHy2vTjJ5hGcF4p4qQbXGKmWkPxY8NqzR3KjH5mN7pL9sT2vW6xZ4K5mN7pL9sT2vW6xZ";

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
