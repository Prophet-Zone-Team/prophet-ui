import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatOrderFundingFailureMessage } from "@/lib/trading/order-funding-check";

describe("formatOrderFundingFailureMessage", () => {
  it("shows only failed funding details", () => {
    const message = formatOrderFundingFailureMessage({
      balance: "fail",
      allowance: "pass",
      balanceDetail:
        "USDC balance: 0.065 USDC available; 5.18 USDC required.",
      allowanceDetail:
        "USDC allowance: 115,792,089,237,316,200,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000 USDC available; 5.18 USDC required."
    });

    assert.equal(
      message,
      "USDC balance: 0.065 USDC available; 5.18 USDC required."
    );
  });

  it("joins multiple failed funding details on separate lines", () => {
    const message = formatOrderFundingFailureMessage({
      balance: "fail",
      allowance: "fail",
      balanceDetail: "Need more USDC.",
      allowanceDetail: "Need more allowance."
    });

    assert.equal(message, "Need more USDC.\nNeed more allowance.");
  });
});
