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
      { marketKind: "team", teams: [{ name: "Brazil" }] }
    );

    assert.equal(
      href,
      "/trade/team?slug=will-brazil-win-the-2026-fifa-world-cup"
    );
  });

  it("routes game positions to the game trade page using fixture slug from slug", () => {
    const href = resolvePortfolioPositionTradeHref(
      { slug: "fif-lie-cyp-2026-06-07-draw" },
      { marketKind: "game" }
    );

    assert.equal(href, "/trade/game?slug=fif-lie-cyp-2026-06-07");
  });

  it("routes game positions using event slug from Gamma context", () => {
    const href = resolvePortfolioPositionTradeHref(
      { slug: "fifwc-bra-mar-2026-06-13" },
      { marketKind: "game" }
    );

    assert.equal(href, "/trade/game?slug=fifwc-bra-mar-2026-06-13");
  });

  it("routes group positions to the group detail page", () => {
    const href = resolvePortfolioPositionTradeHref(
      { slug: "world-cup-group-a-winner" },
      { marketKind: "group" }
    );

    assert.equal(href, "/group?n=a");
  });

  it("routes group positions using position eventSlug when market slug differs", () => {
    const href = resolvePortfolioPositionTradeHref(
      {
        slug: "will-south-korea-win-group-a-in-the-2026-fifa-world-cup",
        eventSlug: "world-cup-group-a-winner"
      },
      { marketKind: "group" }
    );

    assert.equal(href, "/group?n=a");
  });

  it("routes group positions from eventSlug when marketKind is missing", () => {
    const href = resolvePortfolioPositionTradeHref({
      slug: "will-south-korea-win-group-a-in-the-2026-fifa-world-cup",
      eventSlug: "world-cup-group-a-winner"
    });

    assert.equal(href, "/group?n=a");
  });

  it("routes game positions using position eventSlug over market slug suffix", () => {
    const href = resolvePortfolioPositionTradeHref(
      {
        slug: "fifwc-bra-mar-2026-06-13-bra",
        eventSlug: "fifwc-bra-mar-2026-06-13"
      },
      { marketKind: "game" }
    );

    assert.equal(href, "/trade/game?slug=fifwc-bra-mar-2026-06-13");
  });

  it("detects game positions from fixture slug when marketKind is missing", () => {
    assert.equal(
      isPortfolioGamePosition({ slug: "fif-lie-cyp-2026-06-07-draw" }),
      true
    );
    assert.equal(isPortfolioGamePosition({ slug: "brazil" }), false);
  });

  it("does not treat team positions as game when marketKind is team", () => {
    assert.equal(
      isPortfolioGamePosition(
        { slug: "fif-lie-cyp-2026-06-07-draw" },
        { marketKind: "team" }
      ),
      false
    );
  });
});
