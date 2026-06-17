import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TP_BLOCKCHAIN_POLYGON,
  TP_BLOCKCHAIN_SOLANA,
  TP_BLOCKCHAIN_TRON,
} from "@/lib/wallet/tokenpocket/constants";

describe("tokenpocket blockchain constants", () => {
  it("defines polygon, tron, and solana blockchain ids", () => {
    assert.equal(TP_BLOCKCHAIN_POLYGON, "matic");
    assert.equal(TP_BLOCKCHAIN_TRON, "tron");
    assert.equal(TP_BLOCKCHAIN_SOLANA, "solana");
  });
});
