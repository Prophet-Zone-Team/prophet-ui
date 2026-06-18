import type { ComboMarketRecord } from "@/types/combo";

export const mockComboMarkets: ComboMarketRecord[] = [
  {
    id: "mock-combo-mex-win",
    conditionId: "0x4cd7110ff0000000000000000000000000000000000000000000000000110ff",
    positionIds: [
      "101258536288000000000000000000000000000000000000000000000000000000",
      "101258536288100000000000000000000000000000000000000000000000000001",
    ],
    slug: "fifwc-mex-rsa-2026-06-11-mex",
    title: "Will Mexico win on 2026-06-11?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.685", "0.315"],
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/world-cup-mex.png",
    volume: 330327.71,
    tags: ["sports", "soccer", "games", "world-cup"],
  },
  {
    id: "mock-combo-fra-win",
    conditionId: "0x0391ab0e00000000000000000000000000000000000000000000000000ab0e",
    positionIds: [
      "101258536288200000000000000000000000000000000000000000000000000002",
      "101258536288300000000000000000000000000000000000000000000000000003",
    ],
    slug: "fifwc-fra-bra-2026-06-12-fra",
    title: "Will France win on 2026-06-12?",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.52", "0.48"],
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/world-cup-fra.png",
    volume: 218450.25,
    tags: ["sports", "soccer", "games", "world-cup"],
  },
];
