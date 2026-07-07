import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isSolanaConfirmationTimeoutMessage,
  resolveDepositErrorMessage,
  SOLANA_CONFIRMATION_TIMEOUT_FALLBACK,
} from "./deposit-error-message";

const SOLANA_SDK_TIMEOUT_MESSAGE =
  "Transaction was not confirmed in 30.00 seconds. It is unknown if it succeeded or failed. Check signature 2DZ4dwxz using the Solana Explorer or CLI tools.";

describe("isSolanaConfirmationTimeoutMessage", () => {
  it("accepts Solana SDK confirmation timeout messages", () => {
    assert.equal(isSolanaConfirmationTimeoutMessage(SOLANA_SDK_TIMEOUT_MESSAGE), true);
  });

  it("rejects unrelated error messages", () => {
    assert.equal(isSolanaConfirmationTimeoutMessage("Insufficient balance"), false);
    assert.equal(isSolanaConfirmationTimeoutMessage(""), false);
  });
});

describe("resolveDepositErrorMessage", () => {
  it("maps Solana confirmation timeout to friendly fallback message", () => {
    assert.equal(
      resolveDepositErrorMessage(new Error(SOLANA_SDK_TIMEOUT_MESSAGE)),
      SOLANA_CONFIRMATION_TIMEOUT_FALLBACK,
    );
  });

  it("preserves unrelated error messages", () => {
    assert.equal(
      resolveDepositErrorMessage(new Error("Insufficient balance")),
      "Insufficient balance",
    );
  });
});
