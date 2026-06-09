/**
 * Verifies game To Win preview aligns with Polymarket CLOB ask pricing.
 * Run: node --import tsx scripts/verify-game-to-win.ts
 */
import { buildGameBidOrderPreview } from "../src/lib/market/game-order";
import type { GameMarketSnapshot } from "../src/types/market";

function buildMockSnapshot(
  side: "home" | "draw" | "away",
  yesAsk: number,
  probability: number,
): GameMarketSnapshot {
  const sides = ["home", "draw", "away"] as const;

  return {
    match: {
      id: "fifwc-mex-rsa-2026-06-11",
      matchId: 1,
      stage: "GROUP",
      status: "scheduled",
      freshness: { source: "test", status: "live" },
    },
    outcomes: sides.map((item) => ({
      side: item,
      label: item,
      probability: item === side ? probability : 0,
      tokenId: item === side ? "yes-token" : undefined,
      noTokenId: item === side ? "no-token" : undefined,
      yesAsk: item === side ? yesAsk : undefined,
      yesBid: item === side ? yesAsk - 0.01 : undefined,
    })),
    market: {
      volume: 0,
      acceptingOrders: true,
      source: "test",
      freshness: { source: "test", status: "live" },
    },
  };
}

function expectedPolymarketToWin(amount: number, ask: number): number {
  const shares = amount / ask;
  return Math.round(shares * 100) / 100;
}

const cases = [
  { side: "home" as const, label: "Mexico", ask: 0.67, probability: 66.5 },
  { side: "draw" as const, label: "Draw", ask: 0.23, probability: 22 },
  { side: "away" as const, label: "RSA", ask: 0.13, probability: 12.5 },
];

let failed = 0;

for (const testCase of cases) {
  const snapshot = buildMockSnapshot(testCase.side, testCase.ask, testCase.probability);
  const preview = buildGameBidOrderPreview({
    snapshot,
    outcomeSide: testCase.side,
    binarySide: "yes",
    tradeSide: "buy",
    amount: 1,
    limitPrice: testCase.ask,
    orderType: "FAK",
  });

  const expected = expectedPolymarketToWin(1, testCase.ask);
  const delta = Math.abs(preview.potentialPayout - expected);

  if (delta > 0.02) {
    failed += 1;
    console.error(
      `[FAIL] ${testCase.label}: To Win=${preview.potentialPayout}, expected≈${expected}, delta=${delta.toFixed(4)}`,
    );
    continue;
  }

  console.log(
    `[OK] ${testCase.label}: sidePrice=${preview.sidePrice}, To Win=$${preview.potentialPayout.toFixed(2)} (expected≈$${expected.toFixed(2)})`,
  );
}

if (failed > 0) {
  process.exit(1);
}

console.log("All Mexico vs RSA To Win checks passed.");
