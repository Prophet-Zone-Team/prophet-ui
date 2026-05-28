import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mergeTradingReadiness } from "@/lib/trading/merge-trading-readiness";
import type { UserTradingReadiness } from "@/types/market";

function setupReadiness(): UserTradingReadiness {
  return {
    ready: true,
    credentials: { hasClobCredentials: true, storage: "session" },
    checks: [
      { id: "wallet", label: "Wallet", status: "pass", detail: "ok" },
      { id: "allowance", label: "Allowance", status: "pass", detail: "setup ok" },
    ],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("mergeTradingReadiness", () => {
  it("adds balance checks without order funding", () => {
    const merged = mergeTradingReadiness(setupReadiness(), {
      balances: {
        walletAddress: "0xabc",
        usdcAvailable: 25,
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      updatedAt: "2026-01-02T00:00:00.000Z",
    });

    assert.equal(merged.balances?.usdcAvailable, 25);
    assert.equal(merged.checks.find((check) => check.id === "balance")?.status, "pass");
    assert.equal(merged.checks.find((check) => check.id === "allowance")?.detail, "setup ok");
  });

  it("replaces setup allowance with order funding checks", () => {
    const merged = mergeTradingReadiness(
      setupReadiness(),
      {
        balances: {
          walletAddress: "0xabc",
          usdcAvailable: 1,
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
        funding: {
          balance: "fail",
          allowance: "fail",
          balanceDetail: "Need more USDC.",
          allowanceDetail: "Need more allowance.",
        },
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      { tradeSide: "buy" },
    );

    assert.equal(merged.ready, false);
    assert.equal(merged.checks.filter((check) => check.id === "allowance").length, 1);
    assert.equal(
      merged.checks.find((check) => check.id === "allowance")?.detail,
      "Need more allowance.",
    );
  });
});
