import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getTpRedirectContext,
  isTokenPocketFundingSwitchGracePeriod,
  resolveTpHostKind,
} from "@/lib/wallet/tokenpocket/tp-funding-switch";
import {
  TP_FUNDING_SWITCH_FLAG_KEY,
  TP_REDIRECT_STORAGE_KEY,
} from "@/lib/wallet/tokenpocket/constants";

describe("getTpRedirectContext", () => {
  it("parses structured redirect payloads", () => {
    const originalWindow = globalThis.window;
    const originalLocalStorage = globalThis.localStorage;
    const store = new Map<string, string>();

    globalThis.window = {} as Window & typeof globalThis;
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    } as Storage;

    store.set(
      TP_REDIRECT_STORAGE_KEY,
      JSON.stringify({
        redirectPath: "/private",
        hostname: "private-test.prophet.zone",
        hostKind: "private",
      }),
    );

    const context = getTpRedirectContext();

    assert.equal(context?.redirectPath, "/private");
    assert.equal(context?.hostKind, "private");

    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  });

  it("supports legacy pathname-only redirect values", () => {
    const originalWindow = globalThis.window;
    const originalLocalStorage = globalThis.localStorage;
    const store = new Map<string, string>();

    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    } as Storage;

    globalThis.window = {
      location: {
        hostname: "test.prophet.zone",
      },
    } as Window & typeof globalThis;

    store.set(TP_REDIRECT_STORAGE_KEY, "/portfolio?tab=deposit");

    const context = getTpRedirectContext();

    assert.equal(context?.redirectPath, "/portfolio?tab=deposit");
    assert.equal(context?.hostKind, "main");

    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  });
});

describe("isTokenPocketFundingSwitchGracePeriod", () => {
  it("is disabled on private hosts even with a switch flag", () => {
    const originalWindow = globalThis.window;
    const originalSessionStorage = globalThis.sessionStorage;
    const sessionStore = new Map<string, string>();

    globalThis.window = {
      location: {
        hostname: "private-test.prophet.zone",
      },
      tokenpocket: {},
    } as Window & typeof globalThis;

    globalThis.sessionStorage = {
      getItem: (key: string) => sessionStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        sessionStore.set(key, value);
      },
      removeItem: (key: string) => {
        sessionStore.delete(key);
      },
    } as Storage;

    sessionStore.set(
      TP_FUNDING_SWITCH_FLAG_KEY,
      JSON.stringify({
        startedAt: Date.now(),
        blockchain: "solana",
        hostname: "private-test.prophet.zone",
        hostKind: "private",
      }),
    );

    assert.equal(isTokenPocketFundingSwitchGracePeriod(true), false);
    assert.equal(resolveTpHostKind("private-test.prophet.zone"), "private");

    globalThis.window = originalWindow;
    globalThis.sessionStorage = originalSessionStorage;
  });
});
