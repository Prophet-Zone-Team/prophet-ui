import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FUNDING_NETWORKS, FundingNetworkType } from "@/config/funding/networks";
import {
  getDepositConnectLabelKey,
  isDepositTransferWalletConnected,
  resolveDepositTransferWalletAddress,
} from "@/lib/funding/deposit-transfer-wallet";
import { requiresDepositFundingWalletConnection } from "@/lib/funding/stableflow";

const evmToken = {
  ...FUNDING_NETWORKS.bsc,
  blockchain: "bsc",
  chainName: "BNB Chain",
};

const nearToken = {
  ...FUNDING_NETWORKS.near,
  blockchain: "near",
  chainName: "NEAR",
};

const solToken = {
  ...FUNDING_NETWORKS.solana,
  blockchain: "sol",
  chainName: "Solana",
};

const tronToken = {
  ...FUNDING_NETWORKS.tron,
  blockchain: "tron",
  chainName: "Tron",
};

describe("requiresDepositFundingWalletConnection", () => {
  it("returns false for near login with near-origin token", () => {
    assert.equal(
      requiresDepositFundingWalletConnection(nearToken, "near"),
      false,
    );
  });

  it("returns true for near login with sol and tron tokens", () => {
    assert.equal(requiresDepositFundingWalletConnection(solToken, "near"), true);
    assert.equal(requiresDepositFundingWalletConnection(tronToken, "near"), true);
  });

  it("returns false for near login with evm token", () => {
    assert.equal(requiresDepositFundingWalletConnection(evmToken, "near"), false);
  });
});

describe("resolveDepositTransferWalletAddress", () => {
  it("uses session wallet for evm when near login", () => {
    assert.equal(
      resolveDepositTransferWalletAddress(evmToken, "near", "0xabc"),
      "0xabc",
    );
  });

  it("uses session wallet for evm when wallet login", () => {
    assert.equal(
      resolveDepositTransferWalletAddress(evmToken, "wallet", "0xdef"),
      "0xdef",
    );
  });

  it("returns undefined for sol/tron when funding wallet is not connected", () => {
    assert.equal(
      resolveDepositTransferWalletAddress(solToken, "near", "0xabc"),
      undefined,
    );
    assert.equal(
      resolveDepositTransferWalletAddress(tronToken, "near", "0xabc"),
      undefined,
    );
  });
});

describe("isDepositTransferWalletConnected", () => {
  it("returns true for evm when session address is present", () => {
    assert.equal(
      isDepositTransferWalletConnected(evmToken, "near", "0xabc"),
      true,
    );
  });

  it("returns false for evm when session address is missing", () => {
    assert.equal(isDepositTransferWalletConnected(evmToken, "near"), false);
  });
});

describe("getDepositConnectLabelKey", () => {
  it("maps chain types to wallet connect label keys", () => {
    assert.equal(getDepositConnectLabelKey(solToken), "connectSolanaWallet");
    assert.equal(getDepositConnectLabelKey(tronToken), "connectTronWallet");
    assert.equal(getDepositConnectLabelKey(nearToken), "connectNearWallet");
    assert.equal(getDepositConnectLabelKey(evmToken), "connectChainWallet");
  });

  it("falls back to connectWallet for unknown chain types", () => {
    assert.equal(
      getDepositConnectLabelKey({
        chainType: "unknown" as FundingNetworkType,
        chainName: "Unknown",
      }),
      "connectWallet",
    );
  });
});
