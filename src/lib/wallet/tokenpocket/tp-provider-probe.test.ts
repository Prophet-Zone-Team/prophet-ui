import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  probeTokenPocketSolanaProvider,
  probeTokenPocketTronReady,
} from "@/lib/wallet/tokenpocket/tp-provider-probe";

describe("probeTokenPocketSolanaProvider", () => {
  it("returns undefined when window.solana has no connect method", () => {
    const original = globalThis.window;

    globalThis.window = {
      solana: {},
    } as Window & typeof globalThis;

    assert.equal(probeTokenPocketSolanaProvider(), undefined);

    globalThis.window = original;
  });

  it("returns provider when connect is available", () => {
    const original = globalThis.window;
    const provider = {
      connect: async () => ({ publicKey: { toBase58: () => "abc" } }),
    };

    globalThis.window = {
      solana: provider,
    } as Window & typeof globalThis;

    assert.equal(probeTokenPocketSolanaProvider(), provider);

    globalThis.window = original;
  });
});

describe("probeTokenPocketTronReady", () => {
  it("returns true when tronWeb is injected", () => {
    const original = globalThis.window;

    globalThis.window = {
      tronWeb: {},
    } as Window & typeof globalThis;

    assert.equal(probeTokenPocketTronReady(), true);

    globalThis.window = original;
  });

  it("returns true when tronLink exposes tronWeb", () => {
    const original = globalThis.window;

    globalThis.window = {
      tronLink: {
        tronWeb: {},
      },
    } as Window & typeof globalThis;

    assert.equal(probeTokenPocketTronReady(), true);

    globalThis.window = original;
  });

  it("returns false when no tron provider exists", () => {
    const original = globalThis.window;

    globalThis.window = {} as Window & typeof globalThis;

    assert.equal(probeTokenPocketTronReady(), false);

    globalThis.window = original;
  });
});
