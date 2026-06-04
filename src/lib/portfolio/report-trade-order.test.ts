import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveBoundReferralCode,
  resolveReportOrderStatus,
  resolveReportOrderType,
  resolveReportOrderValueUsdc
} from "@/lib/portfolio/report-trade-order";
import type { ProphetLoginReferral } from "@/types/prophet-api";
import type { UserOrderPreview } from "@/types/market";

function buildPreview(
  overrides: Partial<UserOrderPreview> = {}
): UserOrderPreview {
  return {
    tokenId: "token-1",
    teamId: "brazil",
    outcome: "yes",
    side: "buy",
    orderType: "FAK",
    limitPrice: 0.5,
    size: 10,
    estimatedCost: 5,
    estimatedTotalCost: 5.1,
    potentialOutcome: 10,
    tickSize: "0.01",
    stale: false,
    warnings: [],
    ...overrides
  };
}

function buildReferral(
  overrides: Partial<ProphetLoginReferral> = {}
): ProphetLoginReferral {
  return {
    referral_code: "MYCODE",
    referral_link: "https://prophet.exchange?ref=MYCODE",
    tier: "standard",
    kickback_rate: "0.1",
    status: "active",
    referred_user_count: 0,
    total_referred_volume_usdc: "0",
    total_referral_earnings_usdc: "0",
    claimable_balance_usdc: "0",
    claimed_balance_usdc: "0",
    has_bound_referral: true,
    bound_referral_code: "REFCODE",
    ...overrides
  };
}

describe("report-trade-order", () => {
  it("maps GTC to maker and FAK/FOK to taker", () => {
    assert.equal(resolveReportOrderType("GTC"), "maker");
    assert.equal(resolveReportOrderType("FAK"), "taker");
    assert.equal(resolveReportOrderType("FOK"), "taker");
  });

  it("maps user order status to report order status", () => {
    assert.equal(resolveReportOrderStatus("filled"), "completed");
    assert.equal(resolveReportOrderStatus("partially_filled"), "completed");
    assert.equal(resolveReportOrderStatus("rejected"), "failed");
    assert.equal(resolveReportOrderStatus("error"), "failed");
    assert.equal(resolveReportOrderStatus("cancelled"), "cancelled");
    assert.equal(resolveReportOrderStatus("open"), "completed");
    assert.equal(resolveReportOrderStatus(undefined), "completed");
  });

  it("resolves order_value_usdc for buy and sell previews", () => {
    assert.equal(
      resolveReportOrderValueUsdc(
        buildPreview({
          side: "buy",
          estimatedCost: 4,
          estimatedTotalCost: 4.2
        })
      ),
      "4.2"
    );

    assert.equal(
      resolveReportOrderValueUsdc(
        buildPreview({
          side: "sell",
          estimatedCost: 3,
          estimatedProceeds: 2.8
        })
      ),
      "2.8"
    );

    assert.equal(
      resolveReportOrderValueUsdc(
        buildPreview({
          side: "sell",
          estimatedCost: 3,
          estimatedProceeds: undefined
        })
      ),
      "3"
    );
  });

  it("resolves bound referral code only when bound", () => {
    assert.equal(
      resolveBoundReferralCode(
        buildReferral({ has_bound_referral: false, bound_referral_code: "X" })
      ),
      undefined
    );
    assert.equal(
      resolveBoundReferralCode(
        buildReferral({ has_bound_referral: true, bound_referral_code: "  ABC  " })
      ),
      "ABC"
    );
    assert.equal(
      resolveBoundReferralCode(
        buildReferral({ has_bound_referral: true, bound_referral_code: "   " })
      ),
      undefined
    );
    assert.equal(resolveBoundReferralCode(null), undefined);
  });
});
