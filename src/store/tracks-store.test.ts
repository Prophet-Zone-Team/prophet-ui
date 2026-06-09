import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { useTracksStore } from "@/store/tracks-store";

describe("tracks-store", () => {
  beforeEach(() => {
    useTracksStore.getState().reset();
  });

  it("reset clears items, byKey, and accountWallet", () => {
    useTracksStore.setState({
      items: [{ team_name: "Brazil", category: "team" }],
      byKey: { Brazil: true },
      accountWallet: "0xabc",
      status: "ready"
    });

    useTracksStore.getState().reset();

    const state = useTracksStore.getState();

    assert.deepEqual(state.items, []);
    assert.deepEqual(state.byKey, {});
    assert.equal(state.accountWallet, undefined);
    assert.equal(state.status, "idle");
  });

  it("initializeForAccount clears store when wallet is undefined", async () => {
    useTracksStore.setState({
      accountWallet: "0xabc",
      items: [{ team_name: "Brazil", category: "team" }],
      byKey: { Brazil: true }
    });

    await useTracksStore.getState().initializeForAccount(undefined);

    const state = useTracksStore.getState();

    assert.equal(state.accountWallet, undefined);
    assert.deepEqual(state.items, []);
    assert.deepEqual(state.byKey, {});
  });

  it("initializeForAccount skips when wallet is unchanged", async () => {
    useTracksStore.setState({
      accountWallet: "0xabc",
      items: [{ team_name: "Brazil", category: "team" }],
      byKey: { Brazil: true }
    });

    await useTracksStore.getState().initializeForAccount("0xabc");

    const state = useTracksStore.getState();

    assert.equal(state.accountWallet, "0xabc");
    assert.equal(state.items.length, 1);
    assert.equal(state.byKey.Brazil, true);
  });

  it("initializeForAccount resets cached data when wallet switches", async () => {
    useTracksStore.setState({
      accountWallet: "0xold",
      items: [{ team_name: "Brazil", category: "team" }],
      byKey: { Brazil: true }
    });

    await useTracksStore.getState().initializeForAccount("0xnew");

    const state = useTracksStore.getState();

    assert.equal(state.accountWallet, "0xnew");
    assert.deepEqual(state.items, []);
    assert.deepEqual(state.byKey, {});
  });
});
