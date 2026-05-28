import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { UserTradingReadiness } from "@/types/market";
import {
  isOrderFundingAllowanceFailure,
  isSetupAllowanceFailureDetail,
  resolveTradePrimaryAction,
} from "@/lib/trading/trade-primary-action";

const baseInput = {
  isAuthenticated: true,
  session: {
    userId: "user-1",
    createdAt: new Date().toISOString(),
    walletAddress: "0x0000000000000000000000000000000000000001",
    depositWalletStatus: "deployed" as const,
    signatureType: 3,
    funderAddress: "0x0000000000000000000000000000000000000002",
    eligibilityStatus: "eligible" as const,
  },
  tradeSide: "buy" as const,
  submitLabel: "Bid for Yes",
  previewCanSubmit: true,
};

function readinessWithChecks(
  checks: UserTradingReadiness["checks"],
  overrides: Partial<UserTradingReadiness> = {},
): UserTradingReadiness {
  return {
    ready: checks.every((check) => check.status === "pass"),
    session: baseInput.session,
    credentials: { hasClobCredentials: true, storage: "session" },
    checks,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("trade primary action classification", () => {
  it("detects setup allowance failures from detail copy", () => {
    assert.equal(
      isSetupAllowanceFailureDetail(
        "Missing on-chain USDC allowance for exchange.",
      ),
      true,
    );
    assert.equal(
      isOrderFundingAllowanceFailure({
        id: "allowance",
        label: "USDC allowance",
        status: "fail",
        detail: "USDC allowance: 5.00 USDC available; 10.00 USDC required.",
      }),
      true,
    );
  });

  it("routes missing setup allowance to authorize tokens", () => {
    const action = resolveTradePrimaryAction({
      ...baseInput,
      orderReadiness: readinessWithChecks([
        {
          id: "allowance",
          label: "Allowance",
          status: "fail",
          detail: "Missing on-chain USDC allowance for exchange.",
        },
      ]),
    });

    assert.equal(action.kind, "authorize_tokens");
    assert.equal(action.label, "Authorize tokens");
  });

  it("routes order funding allowance failures to refresh allowance", () => {
    const action = resolveTradePrimaryAction({
      ...baseInput,
      orderReadiness: readinessWithChecks([
        {
          id: "balance",
          label: "USDC balance",
          status: "pass",
          detail: "ok",
        },
        {
          id: "allowance",
          label: "USDC allowance",
          status: "fail",
          detail: "USDC allowance: 50.00 USDC available; 10.00 USDC required.",
        },
      ]),
    });

    assert.equal(action.kind, "sync_allowance");
    assert.equal(action.label, "Refresh allowance");
  });

  it("prefers deposit when balance is insufficient", () => {
    const action = resolveTradePrimaryAction({
      ...baseInput,
      orderReadiness: readinessWithChecks([
        {
          id: "balance",
          label: "USDC balance",
          status: "fail",
          detail: "USDC balance: 1.00 USDC available; 10.00 USDC required.",
        },
        {
          id: "allowance",
          label: "USDC allowance",
          status: "fail",
          detail: "USDC allowance: 1.00 USDC available; 10.00 USDC required.",
        },
      ]),
    });

    assert.equal(action.kind, "deposit");
    assert.equal(action.label, "Add funds");
  });

  it("blocks trading when the region is restricted", () => {
    const action = resolveTradePrimaryAction({
      ...baseInput,
      isRegionBlocked: true,
      orderReadiness: readinessWithChecks([]),
    });

    assert.equal(action.kind, "eligibility_blocked");
  });

  it("offers retry when eligibility refresh failed with a network error", () => {
    const action = resolveTradePrimaryAction({
      ...baseInput,
      eligibilityNetworkError: true,
      session: {
        ...baseInput.session,
        eligibilityStatus: "error",
        eligibilityReason: "Polymarket geoblock check timed out.",
      },
      orderReadiness: readinessWithChecks([]),
    });

    assert.equal(action.kind, "retry_eligibility");
  });

  it("uses order readiness over auth readiness for allowance", () => {
    const action = resolveTradePrimaryAction({
      ...baseInput,
      authReadiness: readinessWithChecks([
        {
          id: "allowance",
          label: "Allowance",
          status: "pass",
          detail: "approved",
        },
      ]),
      orderReadiness: readinessWithChecks([
        {
          id: "allowance",
          label: "USDC allowance",
          status: "fail",
          detail: "USDC allowance: 1.00 USDC available; 10.00 USDC required.",
        },
      ]),
    });

    assert.equal(action.kind, "sync_allowance");
  });
});
