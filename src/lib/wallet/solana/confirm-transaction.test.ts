import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Connection } from "@solana/web3.js";

import { confirmSolanaFundingTransaction } from "./confirm-transaction";

const MOCK_SIGNATURE = "2DZ4dwxz9F3GijaD5qHM4dbSC9qL95Doj3Yk5iyGo4rtpZ9idG62tQQLGmDkhy7RfZRBHejcCZHdoNVdJ2d9GiAi";
const MOCK_BLOCKHASH = "EkSnNWid2cvwEVnVx9aFLxB9mRn6G4UXkYwU2K8o6B5c";
const MOCK_LAST_VALID_BLOCK_HEIGHT = 250_000_000;

function createMockConnection() {
  let confirmTransactionCalls: Array<[
    { signature: string; blockhash: string; lastValidBlockHeight: number },
    string | undefined,
  ]> = [];

  const connection = {
    async confirmTransaction(
      strategy: { signature: string; blockhash: string; lastValidBlockHeight: number },
      commitment?: string,
    ) {
      confirmTransactionCalls.push([strategy, commitment]);
      return { context: { slot: 1 }, value: { err: null } };
    },
  } as unknown as Connection;

  return {
    connection,
    getConfirmTransactionCalls: () => confirmTransactionCalls,
  };
}

describe("confirmSolanaFundingTransaction", () => {
  it("calls confirmTransaction with blockheight-based strategy and default commitment", async () => {
    const { connection, getConfirmTransactionCalls } = createMockConnection();

    await confirmSolanaFundingTransaction(connection, {
      signature: MOCK_SIGNATURE,
      blockhash: MOCK_BLOCKHASH,
      lastValidBlockHeight: MOCK_LAST_VALID_BLOCK_HEIGHT,
    });

    const calls = getConfirmTransactionCalls();
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0]?.[0], {
      signature: MOCK_SIGNATURE,
      blockhash: MOCK_BLOCKHASH,
      lastValidBlockHeight: MOCK_LAST_VALID_BLOCK_HEIGHT,
    });
    assert.equal(calls[0]?.[1], "confirmed");
  });

  it("forwards a custom commitment when provided", async () => {
    const { connection, getConfirmTransactionCalls } = createMockConnection();

    await confirmSolanaFundingTransaction(connection, {
      signature: MOCK_SIGNATURE,
      blockhash: MOCK_BLOCKHASH,
      lastValidBlockHeight: MOCK_LAST_VALID_BLOCK_HEIGHT,
      commitment: "finalized",
    });

    const calls = getConfirmTransactionCalls();
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.[1], "finalized");
  });
});
