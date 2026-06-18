import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildNearFundingSlicePatch } from "@/lib/wallet/near/sync-near-funding-slice";

describe("buildNearFundingSlicePatch", () => {
  it("maps a connected account id to a connected funding slice", () => {
    assert.deepEqual(buildNearFundingSlicePatch("alice.near", "MyNearWallet"), {
      address: "alice.near",
      connected: true,
      connecting: false,
      walletName: "MyNearWallet",
    });
  });

  it("clears the funding slice when the account id is missing", () => {
    assert.deepEqual(buildNearFundingSlicePatch(null), {
      address: undefined,
      connected: false,
      connecting: false,
      walletName: undefined,
    });
  });
});
