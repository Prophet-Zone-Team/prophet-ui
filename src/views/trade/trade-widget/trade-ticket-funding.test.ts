import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { UserBalanceSnapshot, UserTradingReadiness } from "@/types/market";
import {
  INSUFFICIENT_FUNDS_MESSAGE,
  isBuyInsufficientFunds
} from "@/views/trade/trade-widget/trade-ticket-helpers";

const preview = { estimatedTotalCost: 10 };

const testCredentials = {
  hasClobCredentials: true,
  storage: "session" as const
};

function testBalances(
  overrides: Partial<UserBalanceSnapshot>
): UserBalanceSnapshot {
  return {
    walletAddress: "0x0000000000000000000000000000000000000001",
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

function readinessWithBalanceCheck(
  status: "pass" | "fail" | "unknown",
  balances?: UserBalanceSnapshot
): UserTradingReadiness {
  return {
    ready: status === "pass",
    credentials: testCredentials,
    checks: [
      {
        id: "balance",
        label: "USDC balance",
        status,
        detail: "test"
      }
    ],
    balances,
    updatedAt: new Date().toISOString()
  };
}

describe("isBuyInsufficientFunds", () => {
  it("returns false for sell orders", () => {
    assert.equal(
      isBuyInsufficientFunds({
        tradeSide: "sell",
        preview,
        readiness: readinessWithBalanceCheck("fail")
      }),
      false
    );
  });

  it("returns false when required cost is zero", () => {
    assert.equal(
      isBuyInsufficientFunds({
        tradeSide: "buy",
        preview: { estimatedTotalCost: 0 },
        readiness: readinessWithBalanceCheck("fail")
      }),
      false
    );
  });

  it("returns true when readiness balance check fails", () => {
    assert.equal(
      isBuyInsufficientFunds({
        tradeSide: "buy",
        preview,
        readiness: readinessWithBalanceCheck(
          "fail",
          testBalances({ usdcAvailable: 100 })
        )
      }),
      true
    );
  });

  it("returns false when readiness balance check passes", () => {
    assert.equal(
      isBuyInsufficientFunds({
        tradeSide: "buy",
        preview,
        readiness: readinessWithBalanceCheck(
          "pass",
          testBalances({ usdcAvailable: 5 })
        )
      }),
      false
    );
  });

  it("falls back to usdcAvailable when balance check is unknown", () => {
    assert.equal(
      isBuyInsufficientFunds({
        tradeSide: "buy",
        preview,
        readiness: readinessWithBalanceCheck(
          "unknown",
          testBalances({ usdcAvailable: 9.99 })
        )
      }),
      true
    );
    assert.equal(
      isBuyInsufficientFunds({
        tradeSide: "buy",
        preview,
        readiness: readinessWithBalanceCheck(
          "unknown",
          testBalances({ usdcAvailable: 10 })
        )
      }),
      false
    );
  });

  it("falls back to clobUsdcAvailable via resolveTradeTicketAvailableCash", () => {
    assert.equal(
      isBuyInsufficientFunds({
        tradeSide: "buy",
        preview,
        readiness: {
          ready: false,
          credentials: testCredentials,
          checks: [],
          balances: testBalances({
            clobUsdcAvailable: 4,
            usdcAvailable: 100
          }),
          updatedAt: new Date().toISOString()
        }
      }),
      true
    );
  });

  it("exports the insufficient funds message constant", () => {
    assert.equal(INSUFFICIENT_FUNDS_MESSAGE, "Insufficient funds");
  });
});
