import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatOrderFundingFailureMessage, checkOrderFunding } from "@/lib/trading/order-funding-check";
import { isTradeSkipSellBalanceCheckEnabled } from "@/lib/trading/trade-sell-test-mode";

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

describe("checkOrderFunding sell balance", () => {
  it("passes when sell balance check is skipped in test mode", () => {
    const original = process.env.NEXT_PUBLIC_TRADE_SKIP_SELL_BALANCE_CHECK;
    process.env.NEXT_PUBLIC_TRADE_SKIP_SELL_BALANCE_CHECK = "true";

    try {
      const result = checkOrderFunding({
        balances: {
          walletAddress: "0x1234567890123456789012345678901234567890",
          usdcAvailable: 0,
          conditionalTokenBalance: 0,
          updatedAt: new Date().toISOString(),
        },
        requirement: { tradeSide: "sell", cost: 1, size: 10 },
      });

      assert.equal(result?.balance, "pass");
      assert.equal(result?.allowance, "pass");
    } finally {
      if (original === undefined) {
        delete process.env.NEXT_PUBLIC_TRADE_SKIP_SELL_BALANCE_CHECK;
      } else {
        process.env.NEXT_PUBLIC_TRADE_SKIP_SELL_BALANCE_CHECK = original;
      }
    }
  });

  it("fails when sell shares exceed conditional token balance", () => {
    if (isTradeSkipSellBalanceCheckEnabled()) {
      return;
    }

    const result = checkOrderFunding({
      balances: {
        walletAddress: "0x1234567890123456789012345678901234567890",
        usdcAvailable: 0,
        conditionalTokenBalance: 1,
        updatedAt: new Date().toISOString(),
      },
      requirement: { tradeSide: "sell", cost: 1, size: 10 },
    });

    assert.equal(result?.balance, "fail");
  });
});
