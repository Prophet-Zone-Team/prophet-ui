import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ROAD_TO_FINAL_BRACKET_VERSION } from "./fixed-group-stage";
import {
  decodeUrlState,
  encodeUrlState,
  hydrateFromUrlPayload
} from "./url-state";

describe("road-to-final url-state bracket version", () => {
  it("encodes the current bracket version in shared state", () => {
    const encoded = encodeUrlState({
      teamId: "brazil",
      knockoutWinners: { 76: "brazil" },
      knockoutMethod: "manualSelection"
    });
    const payload = decodeUrlState(encoded);

    assert.equal(payload?.bv, ROAD_TO_FINAL_BRACKET_VERSION);
  });

  it("hydrates knockout winners only for the current bracket version", () => {
    const encoded = encodeUrlState({
      teamId: "brazil",
      knockoutWinners: { 89: "brazil", 101: "brazil", 104: "brazil" },
      knockoutMethod: "fifaRank"
    });

    const hydrated = hydrateFromUrlPayload(
      decodeUrlState(encoded) ?? {},
      "brazil"
    );

    assert.deepEqual(hydrated.knockoutWinners, {
      74: "paraguay",
      76: "brazil",
      89: "brazil",
      101: "brazil",
      104: "brazil",
    });
    assert.equal(hydrated.knockoutMethod, "fifaRank");
  });

  it("drops stale shared knockout picks but keeps fixed winners when bracket version is missing", () => {
    const hydrated = hydrateFromUrlPayload(
      {
        f: "brazil",
        w: { "89": "brazil", "104": "brazil" },
        km: "fifaRank"
      },
      "brazil"
    );

    assert.deepEqual(hydrated.knockoutWinners, {
      74: "paraguay",
      76: "brazil",
    });
    assert.equal(hydrated.knockoutMethod, "manualSelection");
  });

  it("drops stale shared knockout picks but keeps fixed winners when bracket version is outdated", () => {
    const hydrated = hydrateFromUrlPayload(
      {
        f: "brazil",
        w: { "89": "brazil", "104": "brazil" },
        km: "fifaRank",
        bv: ROAD_TO_FINAL_BRACKET_VERSION - 1
      },
      "brazil"
    );

    assert.deepEqual(hydrated.knockoutWinners, {
      74: "paraguay",
      76: "brazil",
    });
    assert.equal(hydrated.knockoutMethod, "manualSelection");
  });

  it("overrides incorrect fixed-match picks from shared URL state", () => {
    const encoded = encodeUrlState({
      teamId: "germany",
      knockoutWinners: { 74: "germany", 76: "japan", 89: "germany" },
      knockoutMethod: "manualSelection",
    });

    const hydrated = hydrateFromUrlPayload(
      decodeUrlState(encoded) ?? {},
      "germany"
    );

    assert.equal(hydrated.knockoutWinners?.[74], "paraguay");
    assert.equal(hydrated.knockoutWinners?.[76], "brazil");
    assert.equal(hydrated.knockoutWinners?.[89], "germany");
  });
});
