import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isPortfolioGamePosition,
  resolvePortfolioPositionTradeHref
} from "@/lib/portfolio/resolve-position-trade-href";

describe("resolvePortfolioPositionTradeHref", () => {
  it("routes team positions to the team trade page using slug", () => {
    const href = resolvePortfolioPositionTradeHref(
      { slug: "will-brazil-win-the-2026-fifa-world-cup" },
      [{ name: "Brazil" }]
    );

    assert.equal(
      href,
      "/trade/team?slug=will-brazil-win-the-2026-fifa-world-cup"
    );
  });

  it("routes game positions to the game trade page using fixture slug from slug", () => {
    const href = resolvePortfolioPositionTradeHref(
      { slug: "fif-lie-cyp-2026-06-07-draw" },
      [
        { name: "Liechtenstein", ordering: "home" },
        { name: "Cyprus", ordering: "away" }
      ]
    );

    assert.equal(href, "/trade/game?slug=fif-lie-cyp-2026-06-07");
  });

  it("detects game positions from fixture slug when teams context is missing", () => {
    assert.equal(
      isPortfolioGamePosition({ slug: "fif-lie-cyp-2026-06-07-draw" }),
      true
    );
    assert.equal(isPortfolioGamePosition({ slug: "brazil" }), false);
  });
});
