import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FUNDING_NETWORKS, FundingNetworkType } from "@/config/funding/networks";
import {
  filterStableflowTokensForDeposit,
  isSocialAuthLoginMethod,
  shouldDepositViaStableflowQr,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";

function createToken(
  network: (typeof FUNDING_NETWORKS)[keyof typeof FUNDING_NETWORKS],
  blockchain: string,
): StableflowDepositToken {
  return {
    ...network,
    assetId: `${blockchain}-usdc`,
    blockchain,
    symbol: "USDC",
    name: "USDC",
    address: "token-address",
    decimals: 6,
    icon: "/icon.svg",
    minCheckoutUsd: 0,
    price: 1,
  };
}

const evmToken = createToken(FUNDING_NETWORKS.bsc, "bsc");
const nearToken = createToken(FUNDING_NETWORKS.near, "near");
const solToken = createToken(FUNDING_NETWORKS.solana, "sol");
const tronToken = createToken(FUNDING_NETWORKS.tron, "tron");
const allTokens = [evmToken, nearToken, solToken, tronToken];

describe("isSocialAuthLoginMethod", () => {
  it("returns true for email and google", () => {
    assert.equal(isSocialAuthLoginMethod("email"), true);
    assert.equal(isSocialAuthLoginMethod("google"), true);
  });

  it("returns false for other login methods", () => {
    assert.equal(isSocialAuthLoginMethod("wallet"), false);
    assert.equal(isSocialAuthLoginMethod("near"), false);
    assert.equal(isSocialAuthLoginMethod(undefined), false);
  });
});

describe("filterStableflowTokensForDeposit", () => {
  it("keeps only EVM tokens for email and google login", () => {
    assert.deepEqual(
      filterStableflowTokensForDeposit(allTokens, "email"),
      [evmToken],
    );
    assert.deepEqual(
      filterStableflowTokensForDeposit(allTokens, "google"),
      [evmToken],
    );
  });

  it("returns the original list for wallet and near login", () => {
    assert.deepEqual(
      filterStableflowTokensForDeposit(allTokens, "wallet"),
      allTokens,
    );
    assert.deepEqual(
      filterStableflowTokensForDeposit(allTokens, "near"),
      allTokens,
    );
  });

  it("returns an empty list when input is empty", () => {
    assert.deepEqual(filterStableflowTokensForDeposit([], "email"), []);
  });

  it("filters by chainType EVM only", () => {
    const tokens = allTokens.filter(
      (token) => token.chainType === FundingNetworkType.EVM,
    );

    assert.deepEqual(
      filterStableflowTokensForDeposit(allTokens, "google"),
      tokens,
    );
  });
});

describe("shouldDepositViaStableflowQr", () => {
  it("returns true for email and google login regardless of chain", () => {
    assert.equal(shouldDepositViaStableflowQr("email", evmToken), true);
    assert.equal(shouldDepositViaStableflowQr("google", solToken), true);
  });

  it("returns false for near login on all chains", () => {
    assert.equal(shouldDepositViaStableflowQr("near", nearToken), false);
    assert.equal(shouldDepositViaStableflowQr("near", evmToken), false);
    assert.equal(shouldDepositViaStableflowQr("near", solToken), false);
    assert.equal(shouldDepositViaStableflowQr("near", tronToken), false);
  });

  it("returns false for wallet login on EVM, SVM, TVM, and NEAR", () => {
    assert.equal(shouldDepositViaStableflowQr("wallet", evmToken), false);
    assert.equal(shouldDepositViaStableflowQr("wallet", solToken), false);
    assert.equal(shouldDepositViaStableflowQr("wallet", tronToken), false);
    assert.equal(shouldDepositViaStableflowQr("wallet", nearToken), false);
  });
});
