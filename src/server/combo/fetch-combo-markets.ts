import "server-only";

import type { ComboMarketRecord, ComboMarketsResponse } from "@/types/combo";

export async function fetchComboMarketsFromRfqApi({
  limit = 50,
  cursor,
  exclude
}: {
  limit?: number;
  cursor?: string;
  exclude?: string[];
}): Promise<ComboMarketsResponse> {
  const params = new URLSearchParams({
    limit: String(Math.max(1, Math.min(limit, 100)))
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  if (exclude?.length) {
    params.set("exclude", exclude.join(","));
  }

  void params;

  const payload = {
    markets: [
      {
        id: "1897106",
        condition_id:
          "0x825bc4151fd9c139c4f0400c1a6f5d60cf67b2d04f12d69fd9fb5de67b13e4bc",
        position_ids: [
          "1302031158959328596181864012351689816200378008440816705951131802844602040320",
          "1302031158959328596181864012351689816200378008440816705951131802844602040321"
        ],
        slug: "fifwc-cze-rsa-2026-06-18-cze",
        title: "Will Czechia win on 2026-06-18?",
        outcomes: ["Yes", "No"],
        outcome_prices: ["0.515", "0.485"],
        image:
          "https://polymarket-upload.s3.us-east-2.amazonaws.com/soccer ball-bba4025f77.png",
        volume: 3285630.1997849043,
        tags: ["sports", "soccer", "games", "fifa-world-cup"]
      },
      {
        id: "1897117",
        condition_id:
          "0xa6ae199ce172475dd0e29d7584810a15a1d4608398d2f42d7ca39bfac45ed52b",
        position_ids: [
          "1255921515070702639488996033544254797740834105412550430247204829498737426944",
          "1255921515070702639488996033544254797740834105412550430247204829498737426945"
        ],
        slug: "fifwc-mex-kr-2026-06-18-kr",
        title: "Will Korea Republic win on 2026-06-18?",
        outcomes: ["Yes", "No"],
        outcome_prices: ["0.235", "0.765"],
        image:
          "https://polymarket-upload.s3.us-east-2.amazonaws.com/soccer ball-bba4025f77.png",
        volume: 552054.6822840075,
        tags: ["sports", "soccer", "games", "fifa-world-cup"]
      },
      {
        id: "2326582",
        condition_id:
          "0x739ae7457696da4132d04787b96848f38a0d71c0f48347ee69ac55f7e75dad9f",
        position_ids: [
          "696230533019711829970811719331020643323785609364194435389203979744581779456",
          "696230533019711829970811719331020643323785609364194435389203979744581779457"
        ],
        slug: "fifwc-cze-rsa-2026-06-18-total-2pt5",
        title: "Czechia vs. South Africa: O/U 2.5",
        outcomes: ["Over", "Under"],
        outcome_prices: ["0.455", "0.545"],
        image:
          "https://polymarket-upload.s3.us-east-2.amazonaws.com/soccer ball-bba4025f77.png",
        volume: 492751.56828300026,
        tags: ["sports", "soccer", "games", "fifa-world-cup"]
      },
      {
        id: "1897112",
        condition_id:
          "0xc90f95af1a5d4e392fe9cc484f1b1a0983687865e7b85910ae89300c2076e4a1",
        position_ids: [
          "1058463483623516840658217080308388273260318232605334601332731867980340658176",
          "1058463483623516840658217080308388273260318232605334601332731867980340658177"
        ],
        slug: "fifwc-can-qat-2026-06-18-can",
        title: "Will Canada win on 2026-06-18?",
        outcomes: ["Yes", "No"],
        outcome_prices: ["0.765", "0.235"],
        image:
          "https://polymarket-upload.s3.us-east-2.amazonaws.com/soccer ball-bba4025f77.png",
        volume: 414924.29950200126,
        tags: ["sports", "soccer", "games", "fifa-world-cup"]
      },
      {
        id: "1897115",
        condition_id:
          "0x6f05c7bc5ad978f8f9916f05d30a7f752e02b81508c56d82ed7c9245bca163b0",
        position_ids: [
          "1255921515070702639488996033544254797740834105412550430247204829498737426432",
          "1255921515070702639488996033544254797740834105412550430247204829498737426433"
        ],
        slug: "fifwc-mex-kr-2026-06-18-mex",
        title: "Will Mexico win on 2026-06-18?",
        outcomes: ["Yes", "No"],
        outcome_prices: ["0.475", "0.525"],
        image:
          "https://polymarket-upload.s3.us-east-2.amazonaws.com/soccer ball-bba4025f77.png",
        volume: 410255.75542401127,
        tags: ["sports", "soccer", "games", "fifa-world-cup"]
      }
    ],
    next_cursor: "MjE5"
  } as {
    markets?: unknown[];
    next_cursor?: string | null;
    nextCursor?: string | null;
  };

  return {
    markets: Array.isArray(payload.markets)
      ? payload.markets
          .map(normalizeComboMarketRecord)
          .filter((market): market is ComboMarketRecord => Boolean(market))
      : [],
    nextCursor: payload.next_cursor ?? payload.nextCursor ?? null
  };
}

function normalizeComboMarketRecord(value: unknown): ComboMarketRecord | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const positionIds = raw.position_ids ?? raw.positionIds;
  const conditionId = raw.condition_id ?? raw.conditionId;
  const outcomePrices = raw.outcome_prices ?? raw.outcomePrices;
  const id = raw.id;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof conditionId !== "string" ||
    !Array.isArray(positionIds) ||
    positionIds.length < 2
  ) {
    return undefined;
  }

  const outcomes = Array.isArray(raw.outcomes)
    ? (raw.outcomes as string[])
    : ["Yes", "No"];
  const prices = Array.isArray(outcomePrices)
    ? (outcomePrices as string[])
    : ["0", "0"];

  return {
    id: String(id),
    conditionId,
    positionIds: [String(positionIds[0]), String(positionIds[1])],
    slug: typeof raw.slug === "string" ? raw.slug : "",
    title: typeof raw.title === "string" ? raw.title : "",
    outcomes: [outcomes[0] ?? "Yes", outcomes[1] ?? "No"],
    outcomePrices: [prices[0] ?? "0", prices[1] ?? "0"],
    image: typeof raw.image === "string" ? raw.image : undefined,
    volume: typeof raw.volume === "number" ? raw.volume : undefined,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined
  };
}
