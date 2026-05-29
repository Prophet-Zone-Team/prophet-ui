import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { useTrackStatusStore } from "@/store/track-status-store";

describe("track-status-store", () => {
  beforeEach(() => {
    useTrackStatusStore.getState().clearAll();
  });

  it("setTracked adds and removes keys", () => {
    const { setTracked } = useTrackStatusStore.getState();

    setTracked("Brazil", true);
    assert.equal(useTrackStatusStore.getState().byKey.Brazil, true);

    setTracked("Brazil", false);
    assert.equal(useTrackStatusStore.getState().byKey.Brazil, undefined);
  });

  it("hydrateFromApiItems rebuilds the map from API items", () => {
    useTrackStatusStore.getState().setTracked("stale-key", true);

    useTrackStatusStore.getState().hydrateFromApiItems([
      { team_name: "Brazil", category: "team" },
      { slug: "fifwc-mex-rsa-2026-06-11", category: "game", goals: [1] }
    ]);

    const byKey = useTrackStatusStore.getState().byKey;

    assert.deepEqual(byKey, {
      Brazil: true,
      "fifwc-mex-rsa-2026-06-11": true
    });
  });

  it("clearAll empties tracked keys", () => {
    useTrackStatusStore.getState().setTracked("Brazil", true);
    useTrackStatusStore.getState().clearAll();

    assert.deepEqual(useTrackStatusStore.getState().byKey, {});
  });
});
