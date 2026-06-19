import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { estimateComboPreview } from "@/lib/combo/estimate-preview";

describe("estimateComboPreview", () => {
  it("multiplies buy-side leg prices for combo payout preview", () => {
    const preview = estimateComboPreview({
      legs: [
        {
          id: "1",
          legPositionId: "a",
          outcomeSide: "yes",
          referencePrice: 0.55,
        },
        {
          id: "2",
          legPositionId: "b",
          outcomeSide: "yes",
          referencePrice: 0.25,
        },
      ],
      bidAmountUsd: 1,
    });

    assert.equal(preview.impliedProbability, 0.1375);
    assert.equal(preview.multiplier, 1 / 0.1375);
    assert.equal(preview.toWinAmount, 1 / 0.1375);
  });

  it("returns zero when any leg price is missing", () => {
    const preview = estimateComboPreview({
      legs: [
        {
          id: "1",
          legPositionId: "a",
          outcomeSide: "yes",
          referencePrice: 0.55,
        },
        {
          id: "2",
          legPositionId: "b",
          outcomeSide: "yes",
          referencePrice: 0,
        },
      ],
      bidAmountUsd: 10,
    });

    assert.equal(preview.multiplier, 0);
    assert.equal(preview.toWinAmount, 0);
  });
});
