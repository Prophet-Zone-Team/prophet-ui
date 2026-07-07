import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolvePrivateTopupError,
  resolvePrivateTopupErrorMessage,
  SOLANA_CONFIRMATION_TIMEOUT_FALLBACK,
} from "./private-topup-error-message";

const SOLANA_SDK_TIMEOUT_MESSAGE =
  "Transaction was not confirmed in 30.00 seconds. It is unknown if it succeeded or failed. Check signature 2DZ4dwxz using the Solana Explorer or CLI tools.";

describe("resolvePrivateTopupError", () => {
  it("maps Solana confirmation timeout to friendly fallback message", () => {
    const result = resolvePrivateTopupError(
      new Error(SOLANA_SDK_TIMEOUT_MESSAGE),
    );

    assert.equal(result.message, SOLANA_CONFIRMATION_TIMEOUT_FALLBACK);
    assert.equal(result.isSolanaConfirmationTimeout, true);
  });

  it("preserves unrelated error messages", () => {
    const result = resolvePrivateTopupError(new Error("Insufficient balance"));

    assert.equal(result.message, "Insufficient balance");
    assert.equal(result.isSolanaConfirmationTimeout, false);
  });
});

describe("resolvePrivateTopupErrorMessage", () => {
  it("returns friendly message for Solana confirmation timeout", () => {
    assert.equal(
      resolvePrivateTopupErrorMessage(new Error(SOLANA_SDK_TIMEOUT_MESSAGE)),
      SOLANA_CONFIRMATION_TIMEOUT_FALLBACK,
    );
  });

  it("preserves unrelated error messages", () => {
    assert.equal(
      resolvePrivateTopupErrorMessage(new Error("Insufficient balance")),
      "Insufficient balance",
    );
  });
});
