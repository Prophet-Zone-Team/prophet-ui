import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  ProphetApiError,
  bindProphetTelegram,
  getProphetTopTracks,
  getProphetTrackList,
  getProphetTracks,
  isProphetAuthenticated,
  logoutProphet,
  requireProphetApiToken,
  setProphetApiToken,
  trackProphet,
  untrackProphet
} from "@/service/prophet";

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    }
  };
}

describe("prophet auth guards", () => {
  beforeEach(() => {
    logoutProphet();
    Object.defineProperty(globalThis, "localStorage", {
      value: createLocalStorageMock(),
      configurable: true,
      writable: true
    });
  });

  it("requireProphetApiToken throws 401 when no token is stored", () => {
    assert.throws(
      () => requireProphetApiToken(),
      (error: unknown) => {
        assert.ok(error instanceof ProphetApiError);
        assert.equal(error.code, 401);
        return true;
      }
    );
  });

  it("requireProphetApiToken returns the stored token", () => {
    setProphetApiToken("test-token");
    assert.equal(requireProphetApiToken(), "test-token");
    assert.equal(isProphetAuthenticated(), true);
  });

  it("user APIs throw 401 before making requests when unauthenticated", async () => {
    const assertAuthRequired = async (action: () => Promise<unknown>) => {
      await assert.rejects(action, (error: unknown) => {
        assert.ok(error instanceof ProphetApiError);
        assert.equal(error.code, 401);
        return true;
      });
    };

    await assertAuthRequired(() =>
      bindProphetTelegram({ tg_user_id: 1 })
    );
    await assertAuthRequired(() =>
      trackProphet({ category: "team", slug: "brazil" })
    );
    await assertAuthRequired(() => getProphetTracks());
    await assertAuthRequired(() => getProphetTrackList());
    await assertAuthRequired(() => untrackProphet({ slug: "brazil" }));
  });

  it("logoutProphet clears token and authentication state", () => {
    setProphetApiToken("test-token");
    assert.equal(isProphetAuthenticated(), true);

    logoutProphet();

    assert.equal(isProphetAuthenticated(), false);
    assert.throws(() => requireProphetApiToken());
  });

  it("getProphetTopTracks does not require authentication token", () => {
    logoutProphet();
    assert.equal(isProphetAuthenticated(), false);
    assert.equal(typeof getProphetTopTracks, "function");
  });
});
