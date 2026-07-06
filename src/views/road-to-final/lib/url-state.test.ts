import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ROAD_TO_FINAL_BRACKET_VERSION } from "./fixed-group-stage";
import {
  decodeUrlState,
  encodeUrlState,
  hydrateFromUrlPayload
} from "./url-state";

const EXPECTED_FIXED_WINNERS = {
  73: "canada",
  74: "paraguay",
  75: "morocco",
  76: "brazil",
  77: "france",
  78: "norway",
  79: "mexico",
  80: "england",
  81: "usa",
  82: "belgium",
  83: "portugal",
  84: "spain",
  85: "switzerland",
  86: "argentina",
  87: "colombia",
  88: "egypt",
  89: "france",
  90: "morocco",
  91: "norway",
  92: "england",
};

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
      knockoutWinners: { 93: "brazil", 101: "brazil", 104: "brazil" },
      knockoutMethod: "fifaRank"
    });

    const hydrated = hydrateFromUrlPayload(
      decodeUrlState(encoded) ?? {},
      "brazil"
    );

    assert.deepEqual(hydrated.knockoutWinners, {
      ...EXPECTED_FIXED_WINNERS,
      93: "brazil",
      101: "brazil",
      104: "brazil",
    });
    assert.equal(hydrated.knockoutMethod, "fifaRank");
  });

  it("drops stale shared knockout picks but keeps fixed winners when bracket version is missing", () => {
    const hydrated = hydrateFromUrlPayload(
      {
        f: "brazil",
        w: { "93": "brazil", "104": "brazil" },
        km: "fifaRank"
      },
      "brazil"
    );

    assert.deepEqual(hydrated.knockoutWinners, EXPECTED_FIXED_WINNERS);
    assert.equal(hydrated.knockoutMethod, "manualSelection");
  });

  it("drops stale shared knockout picks but keeps fixed winners when bracket version is outdated", () => {
    const hydrated = hydrateFromUrlPayload(
      {
        f: "brazil",
        w: { "93": "brazil", "104": "brazil" },
        km: "fifaRank",
        bv: ROAD_TO_FINAL_BRACKET_VERSION - 1
      },
      "brazil"
    );

    assert.deepEqual(hydrated.knockoutWinners, EXPECTED_FIXED_WINNERS);
    assert.equal(hydrated.knockoutMethod, "manualSelection");
  });

  it("overrides incorrect fixed-match picks from shared URL state", () => {
    const encoded = encodeUrlState({
      teamId: "germany",
      knockoutWinners: {
        74: "germany",
        76: "japan",
        79: "ecuador",
        80: "congo-dr",
        81: "bosnia-herzegovina",
        82: "senegal",
        83: "croatia",
        84: "austria",
        85: "algeria",
        86: "cape-verde",
        87: "ghana",
        88: "australia",
        89: "paraguay",
        90: "canada",
        91: "brazil",
        92: "mexico",
        93: "germany",
      },
      knockoutMethod: "manualSelection",
    });

    const hydrated = hydrateFromUrlPayload(
      decodeUrlState(encoded) ?? {},
      "germany"
    );

    assert.equal(hydrated.knockoutWinners?.[73], "canada");
    assert.equal(hydrated.knockoutWinners?.[74], "paraguay");
    assert.equal(hydrated.knockoutWinners?.[75], "morocco");
    assert.equal(hydrated.knockoutWinners?.[76], "brazil");
    assert.equal(hydrated.knockoutWinners?.[77], "france");
    assert.equal(hydrated.knockoutWinners?.[78], "norway");
    assert.equal(hydrated.knockoutWinners?.[79], "mexico");
    assert.equal(hydrated.knockoutWinners?.[80], "england");
    assert.equal(hydrated.knockoutWinners?.[81], "usa");
    assert.equal(hydrated.knockoutWinners?.[82], "belgium");
    assert.equal(hydrated.knockoutWinners?.[83], "portugal");
    assert.equal(hydrated.knockoutWinners?.[84], "spain");
    assert.equal(hydrated.knockoutWinners?.[85], "switzerland");
    assert.equal(hydrated.knockoutWinners?.[86], "argentina");
    assert.equal(hydrated.knockoutWinners?.[87], "colombia");
    assert.equal(hydrated.knockoutWinners?.[88], "egypt");
    assert.equal(hydrated.knockoutWinners?.[89], "france");
    assert.equal(hydrated.knockoutWinners?.[90], "morocco");
    assert.equal(hydrated.knockoutWinners?.[91], "norway");
    assert.equal(hydrated.knockoutWinners?.[92], "england");
    assert.equal(hydrated.knockoutWinners?.[93], "germany");
  });
});
