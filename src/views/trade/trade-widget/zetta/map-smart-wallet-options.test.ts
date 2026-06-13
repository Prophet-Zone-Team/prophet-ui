import assert from "node:assert/strict";
import test from "node:test";

import { resolveZettaOutcomeWalletCounts, resolveZettaTeamWalletCounts } from "./fetch-smart-wallets";
import {
  classifySmartWalletOptionSide,
  mapSmartWalletOptionsBySide,
  resolveZettaEventTeamNames
} from "./map-smart-wallet-options";
import type { ZettaSmartWalletsResponse } from "./types";

const samplePayload: ZettaSmartWalletsResponse = {
  event: {
    event_id: "351717",
    slug: "fifwc-can-bih-2026-06-12",
    title: "Canada vs. Bosnia and Herzegovina",
    category: "",
    active: true,
    closed: false,
    start_time: "2026-04-07 06:48:44.921",
    end_time: "2026-06-13 03:00:00.000",
    updated_at: "2026-06-06 19:39:16.283"
  },
  options: [
    {
      market_question: "Will Bosnia and Herzegovina win on 2026-06-12?",
      yes: {
        smart_wallet_count: 0,
        smart_amount: 0,
        whale_wallet_count: 3,
        whale_amount: 100
      },
      no: {
        smart_wallet_count: 0,
        smart_amount: 0,
        whale_wallet_count: 5,
        whale_amount: 200
      }
    },
    {
      market_question: "Will Canada vs. Bosnia and Herzegovina end in a draw?",
      yes: {
        smart_wallet_count: 1,
        smart_amount: 20,
        whale_wallet_count: 3,
        whale_amount: 300
      },
      no: {
        smart_wallet_count: 0,
        smart_amount: 0,
        whale_wallet_count: 2,
        whale_amount: 40
      }
    },
    {
      market_question: "Will Canada win on 2026-06-12?",
      yes: {
        smart_wallet_count: 1,
        smart_amount: 1000,
        whale_wallet_count: 4,
        whale_amount: 400
      },
      no: {
        smart_wallet_count: 0,
        smart_amount: 0,
        whale_wallet_count: 7,
        whale_amount: 500
      }
    }
  ]
};

test("classifySmartWalletOptionSide maps moneyline options to home, draw, and away", () => {
  assert.equal(
    classifySmartWalletOptionSide(
      "Will Canada win on 2026-06-12?",
      "Canada",
      "Bosnia and Herzegovina"
    ),
    "home"
  );
  assert.equal(
    classifySmartWalletOptionSide(
      "Will Canada vs. Bosnia and Herzegovina end in a draw?",
      "Canada",
      "Bosnia and Herzegovina"
    ),
    "draw"
  );
  assert.equal(
    classifySmartWalletOptionSide(
      "Will Bosnia and Herzegovina win on 2026-06-12?",
      "Canada",
      "Bosnia and Herzegovina"
    ),
    "away"
  );
});

test("mapSmartWalletOptionsBySide indexes all three moneyline options", () => {
  const mapped = mapSmartWalletOptionsBySide(
    samplePayload.options,
    "Canada",
    "Bosnia and Herzegovina"
  );

  assert.equal(mapped.home?.yes.smart_wallet_count, 1);
  assert.equal(mapped.draw?.yes.smart_wallet_count, 1);
  assert.equal(mapped.away?.no.whale_wallet_count, 5);
});

test("resolveZettaOutcomeWalletCounts returns smart and whale counts for selected side", () => {
  const counts = resolveZettaOutcomeWalletCounts(
    samplePayload,
    "home",
    "Canada",
    "Bosnia and Herzegovina"
  );

  assert.deepEqual(counts, {
    side: "home",
    smartWallet: {
      yesCount: 1,
      noCount: 0
    },
    bigWhale: {
      yesCount: 4,
      noCount: 7
    }
  });
});

test("resolveZettaOutcomeWalletCounts omits smartWallet when smart counts are missing", () => {
  const counts = resolveZettaOutcomeWalletCounts(
    {
      ...samplePayload,
      options: [
        {
          market_question: "Will Canada win on 2026-06-12?",
          yes: {
            smart_wallet_count: null as unknown as number,
            smart_amount: 0,
            whale_wallet_count: 4,
            whale_amount: 400
          },
          no: {
            smart_wallet_count: undefined as unknown as number,
            smart_amount: 0,
            whale_wallet_count: 7,
            whale_amount: 500
          }
        }
      ]
    },
    "home",
    "Canada",
    "Bosnia and Herzegovina"
  );

  assert.equal(counts?.smartWallet, undefined);
  assert.deepEqual(counts?.bigWhale, {
    yesCount: 4,
    noCount: 7
  });
});

test("resolveZettaOutcomeWalletCounts returns undefined when both metrics are missing", () => {
  const counts = resolveZettaOutcomeWalletCounts(
    {
      ...samplePayload,
      options: [
        {
          market_question: "Will Canada win on 2026-06-12?",
          yes: {
            smart_wallet_count: null as unknown as number,
            smart_amount: 0,
            whale_wallet_count: null as unknown as number,
            whale_amount: 0
          },
          no: {
            smart_wallet_count: undefined as unknown as number,
            smart_amount: 0,
            whale_wallet_count: undefined as unknown as number,
            whale_amount: 0
          }
        }
      ]
    },
    "home",
    "Canada",
    "Bosnia and Herzegovina"
  );

  assert.equal(counts, undefined);
});

test("resolveZettaEventTeamNames parses home and away from event title", () => {
  assert.deepEqual(
    resolveZettaEventTeamNames(
      "United States vs. Paraguay",
      "USA",
      "Paraguay"
    ),
    {
      homeTeamName: "United States",
      awayTeamName: "Paraguay"
    }
  );
});

test("resolveZettaOutcomeWalletCounts uses event title team names when UI labels differ", () => {
  const usaPayload: ZettaSmartWalletsResponse = {
    event: {
      event_id: "351718",
      slug: "fifwc-usa-par-2026-06-12",
      title: "United States vs. Paraguay",
      category: "",
      active: true,
      closed: false,
      start_time: "2026-04-07 06:27:03.503",
      end_time: "2026-06-13 09:00:00.000",
      updated_at: "2026-06-06 19:40:03.764"
    },
    options: [
      {
        market_question: "Will Paraguay win on 2026-06-12?",
        yes: {
          smart_wallet_count: 0,
          smart_amount: 0,
          whale_wallet_count: 6,
          whale_amount: 4016.7
        },
        no: {
          smart_wallet_count: 0,
          smart_amount: 0,
          whale_wallet_count: 2,
          whale_amount: 252.06
        }
      },
      {
        market_question: "Will United States vs. Paraguay end in a draw?",
        yes: {
          smart_wallet_count: 0,
          smart_amount: 0,
          whale_wallet_count: 4,
          whale_amount: 1645.61
        },
        no: {
          smart_wallet_count: 0,
          smart_amount: 0,
          whale_wallet_count: 2,
          whale_amount: 50.7
        }
      },
      {
        market_question: "Will United States win on 2026-06-12?",
        yes: {
          smart_wallet_count: 3,
          smart_amount: 5267.98,
          whale_wallet_count: 9,
          whale_amount: 55652.76
        },
        no: {
          smart_wallet_count: 0,
          smart_amount: 0,
          whale_wallet_count: 3,
          whale_amount: 46509.78
        }
      }
    ]
  };

  const drawCounts = resolveZettaOutcomeWalletCounts(
    usaPayload,
    "draw",
    "USA",
    "Paraguay"
  );

  assert.deepEqual(drawCounts, {
    side: "draw",
    smartWallet: {
      yesCount: 0,
      noCount: 0
    },
    bigWhale: {
      yesCount: 4,
      noCount: 2
    }
  });

  const awayCounts = resolveZettaOutcomeWalletCounts(
    usaPayload,
    "away",
    "USA",
    "Paraguay"
  );

  assert.deepEqual(awayCounts?.bigWhale, {
    yesCount: 6,
    noCount: 2
  });
});

test("resolveZettaTeamWalletCounts returns counts from a single team market option", () => {
  const counts = resolveZettaTeamWalletCounts(
    {
      ...samplePayload,
      options: [
        {
          market_question: "Will France win the 2026 FIFA World Cup?",
          yes: {
            smart_wallet_count: 5,
            smart_amount: 500,
            whale_wallet_count: 13,
            whale_amount: 1300
          },
          no: {
            smart_wallet_count: 2,
            smart_amount: 200,
            whale_wallet_count: 12,
            whale_amount: 1200
          }
        }
      ]
    },
    "France"
  );

  assert.deepEqual(counts, {
    side: "home",
    smartWallet: {
      yesCount: 5,
      noCount: 2
    },
    bigWhale: {
      yesCount: 13,
      noCount: 12
    }
  });
});
