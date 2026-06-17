import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { WalletReadyState as SolanaWalletReadyState, type WalletAdapter } from "@solana/wallet-adapter-base";

import { shouldHideFundingWalletChange } from "@/context/rainbowkit/utils";
import { getInAppSolanaWalletName, resolveInAppSolanaWallet } from "@/lib/wallet/solana/in-app-adapters";
import { resolveInAppTronAdapter } from "@/lib/wallet/tron/connect-in-app-browser";

function createTronAdapter(name: string, readyState = "Found") {
  return {
    name,
    readyState,
    address: null,
    connect: async () => undefined,
  };
}

describe("resolveInAppTronAdapter", () => {
  const adapters = [
    createTronAdapter("TokenPocket"),
    createTronAdapter("OKX Wallet"),
    createTronAdapter("MetaMask"),
    createTronAdapter("Binance Wallet"),
    createTronAdapter("TronLink"),
  ];

  it("maps each in-app wallet kind to its dedicated adapter", () => {
    assert.equal(resolveInAppTronAdapter(adapters, "tokenpocket")?.name, "TokenPocket");
    assert.equal(resolveInAppTronAdapter(adapters, "okx")?.name, "OKX Wallet");
    assert.equal(resolveInAppTronAdapter(adapters, "metamask")?.name, "MetaMask");
    assert.equal(resolveInAppTronAdapter(adapters, "binance")?.name, "Binance Wallet");
  });

  it("does not fall back to TronLink", () => {
    const onlyTronLink = [createTronAdapter("TronLink")];
    assert.equal(resolveInAppTronAdapter(onlyTronLink, "okx"), undefined);
  });

  it("requires readyState Found", () => {
    const notFound = [createTronAdapter("OKX Wallet", "NotFound")];
    assert.equal(resolveInAppTronAdapter(notFound, "okx"), undefined);
  });
});

describe("resolveInAppSolanaWallet", () => {
  const wallets = [
    {
      name: "OKX Wallet",
      readyState: SolanaWalletReadyState.Installed,
      url: "https://okx.com",
      icon: "",
      publicKey: null,
      connecting: false,
      connected: false,
      connect: async () => undefined,
      disconnect: async () => undefined,
      sendTransaction: async () => "",
      on: () => undefined,
      off: () => undefined,
      emit: () => false,
    },
    {
      name: "MetaMask",
      readyState: SolanaWalletReadyState.Installed,
      url: "https://metamask.io",
      icon: "",
      publicKey: null,
      connecting: false,
      connected: false,
      connect: async () => undefined,
      disconnect: async () => undefined,
      sendTransaction: async () => "",
      on: () => undefined,
      off: () => undefined,
      emit: () => false,
    },
    {
      name: "Binance Wallet",
      readyState: SolanaWalletReadyState.Installed,
      url: "https://binance.com",
      icon: "",
      publicKey: null,
      connecting: false,
      connected: false,
      connect: async () => undefined,
      disconnect: async () => undefined,
      sendTransaction: async () => "",
      on: () => undefined,
      off: () => undefined,
      emit: () => false,
    },
    {
      name: "TokenPocket",
      readyState: SolanaWalletReadyState.Installed,
      url: "https://www.tokenpocket.pro",
      icon: "",
      publicKey: null,
      connecting: false,
      connected: false,
      connect: async () => undefined,
      disconnect: async () => undefined,
      sendTransaction: async () => "",
      on: () => undefined,
      off: () => undefined,
      emit: () => false,
    },
    {
      name: "Phantom",
      readyState: SolanaWalletReadyState.Installed,
      url: "https://phantom.app",
      icon: "",
      publicKey: null,
      connecting: false,
      connected: false,
      connect: async () => undefined,
      disconnect: async () => undefined,
      sendTransaction: async () => "",
      on: () => undefined,
      off: () => undefined,
      emit: () => false,
    },
  ];

  it("maps each in-app wallet kind to its dedicated wallet name", () => {
    assert.equal(getInAppSolanaWalletName("okx"), "OKX Wallet");
    assert.equal(getInAppSolanaWalletName("metamask"), "MetaMask");
    assert.equal(getInAppSolanaWalletName("binance"), "Binance Wallet");
    assert.equal(getInAppSolanaWalletName("tokenpocket"), "TokenPocket");
  });

  it("resolves the host wallet adapter by kind", () => {
    const typedWallets = wallets as unknown as WalletAdapter[];
    assert.equal(resolveInAppSolanaWallet(typedWallets, "okx")?.name, "OKX Wallet");
    assert.equal(resolveInAppSolanaWallet(typedWallets, "metamask")?.name, "MetaMask");
    assert.equal(resolveInAppSolanaWallet(typedWallets, "binance")?.name, "Binance Wallet");
    assert.equal(resolveInAppSolanaWallet(typedWallets, "tokenpocket")?.name, "TokenPocket");
  });
});

describe("shouldHideFundingWalletChange", () => {
  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, "window", {
      configurable: true,
      value: originalWindow,
    });
    Object.defineProperty(global, "document", {
      configurable: true,
      value: originalDocument,
    });
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("returns true inside OKX in-app browser", () => {
    Object.defineProperty(global, "window", {
      configurable: true,
      value: {
        ethereum: { isOkxWallet: true },
        location: { pathname: "/", search: "" },
      },
    });
    Object.defineProperty(global, "document", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { userAgent: "OKApp" },
    });

    assert.equal(shouldHideFundingWalletChange(), true);
  });

  it("returns false in a regular desktop browser", () => {
    Object.defineProperty(global, "window", {
      configurable: true,
      value: {
        location: { pathname: "/", search: "" },
      },
    });
    Object.defineProperty(global, "document", {
      configurable: true,
      value: {},
    });
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { userAgent: "Mozilla/5.0 Macintosh" },
    });

    assert.equal(shouldHideFundingWalletChange(), false);
  });
});
