import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FundingNetworkType } from "@/config/funding/networks";
import { filterEvmFundingTokens } from "@/lib/funding/evm-balances";

describe("filterEvmFundingTokens", () => {
  it("keeps only EVM chainType tokens", () => {
    const tokens = [
      { chainType: FundingNetworkType.EVM, chainId: 137 },
      { chainType: FundingNetworkType.SVM, chainId: 728126428 },
      { chainType: FundingNetworkType.TVM, chainId: 999999999 },
      { chainType: FundingNetworkType.NEAR, chainId: 1151111081099710 },
    ];

    const filtered = filterEvmFundingTokens(tokens);

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.chainId, 137);
  });
});
