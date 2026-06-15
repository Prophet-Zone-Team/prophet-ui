import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import {
  classifyGammaPortfolioMarket,
  mapGammaMarketToTeamsConditionEntry,
  parseGroupLetterFromEventSlug
} from "@/lib/portfolio/map-gamma-portfolio-market";

const portugalTeamMarket: GammaMarketRecord = {
  conditionId: "0x4f3421fb000000000000000000000000000000000000000000000000000001",
  slug: "will-portugal-win-the-2026-fifa-world-cup-912",
  question: "Will Portugal win the 2026 FIFA World Cup?",
  groupItemTitle: "Portugal",
  icon: "https://gamma.example/portugal.png",
  events: [{ slug: "world-cup-winner", title: "2026 FIFA World Cup Winner" }]
};

const brazilGameMarket: GammaMarketRecord = {
  conditionId: "0xa75053ff000000000000000000000000000000000000000000000000000001",
  slug: "fifwc-bra-mar-2026-06-13-bra",
  question: "Will Brazil beat Morocco?",
  groupItemTitle: "Brazil",
  sportsMarketType: "moneyline",
  icon: "https://gamma.example/soccer.png",
  events: [
    {
      slug: "fifwc-bra-mar-2026-06-13",
      title: "Brazil vs. Morocco",
      gameId: "game-123"
    }
  ]
};

const southKoreaGroupMarket: GammaMarketRecord = {
  conditionId: "0xb366117d000000000000000000000000000000000000000000000000000001",
  slug: "will-south-korea-win-group-a",
  question: "Will South Korea win Group A?",
  groupItemTitle: "South Korea",
  icon: "https://gamma.example/korea.png",
  events: [
    {
      slug: "world-cup-group-a-winner",
      title: "World Cup Group A Winner"
    }
  ]
};

describe("classifyGammaPortfolioMarket", () => {
  it("classifies winner markets as team", () => {
    assert.equal(classifyGammaPortfolioMarket(portugalTeamMarket), "team");
  });

  it("classifies moneyline fixture markets as game", () => {
    assert.equal(classifyGammaPortfolioMarket(brazilGameMarket), "game");
  });

  it("classifies group winner markets as group", () => {
    assert.equal(classifyGammaPortfolioMarket(southKoreaGroupMarket), "group");
  });
});

describe("mapGammaMarketToTeamsConditionEntry", () => {
  it("maps team markets with market slug and single team", () => {
    const entry = mapGammaMarketToTeamsConditionEntry(portugalTeamMarket);

    assert.ok(entry);
    assert.equal(entry.marketKind, "team");
    assert.equal(entry.slug, "will-portugal-win-the-2026-fifa-world-cup-912");
    assert.equal(entry.icon, "https://gamma.example/portugal.png");
    assert.equal(entry.question, "Will Portugal win the 2026 FIFA World Cup?");
    assert.equal(entry.teams.length, 1);
    assert.equal(entry.teams[0]?.name, "Portugal");
  });

  it("maps game markets with event slug and single team without parsing versus title", () => {
    const entry = mapGammaMarketToTeamsConditionEntry(brazilGameMarket);

    assert.ok(entry);
    assert.equal(entry.marketKind, "game");
    assert.equal(entry.slug, "fifwc-bra-mar-2026-06-13");
    assert.equal(entry.teams.length, 1);
    assert.equal(entry.teams[0]?.name, "Brazil");
  });

  it("maps group markets with event slug and single team", () => {
    const entry = mapGammaMarketToTeamsConditionEntry(southKoreaGroupMarket);

    assert.ok(entry);
    assert.equal(entry.marketKind, "group");
    assert.equal(entry.slug, "world-cup-group-a-winner");
    assert.equal(entry.teams.length, 1);
    assert.equal(entry.teams[0]?.name, "South Korea");
  });
});

describe("parseGroupLetterFromEventSlug", () => {
  it("extracts the group letter from event slug", () => {
    assert.equal(parseGroupLetterFromEventSlug("world-cup-group-a-winner"), "A");
    assert.equal(parseGroupLetterFromEventSlug("world-cup-group-l-winner"), "L");
  });
});
