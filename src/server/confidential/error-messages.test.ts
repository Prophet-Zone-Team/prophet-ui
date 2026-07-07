import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatConfidentialApiErrorMessage } from "./format-confidential-api-error-message.ts";

describe("formatConfidentialApiErrorMessage", () => {
  it("formats base units in try-at-least errors using token decimals", () => {
    assert.equal(
      formatConfidentialApiErrorMessage(
        "Amount is too low for bridge, try at least 6400",
        6,
      ),
      "Amount is too low for bridge, try at least 0.0064",
    );
  });

  it("supports 18-decimal tokens", () => {
    assert.equal(
      formatConfidentialApiErrorMessage("Amount is too low, try at least 1000000000000000000", 18),
      "Amount is too low, try at least 1",
    );
  });

  it("returns unrelated messages unchanged", () => {
    const message = "Quote did not return a deposit address.";

    assert.equal(formatConfidentialApiErrorMessage(message, 6), message);
  });

  it("does not reformat messages that already contain a decimal amount", () => {
    const message = "Amount is too low for bridge, try at least 0.0064";

    assert.equal(formatConfidentialApiErrorMessage(message, 6), message);
  });

  it("falls back to the original message when base units are invalid", () => {
    const message = "Amount is too low, try at least not-a-number";

    assert.equal(formatConfidentialApiErrorMessage(message, 6), message);
  });
});
