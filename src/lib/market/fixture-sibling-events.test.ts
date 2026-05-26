import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isFixtureMainEventSlug,
  resolveFixtureSiblingSlugs,
} from "@/lib/market/fixture-sibling-events";

describe("fixture sibling events", () => {
  it("resolves sibling slugs for main fifwc fixture events", () => {
  assert.equal(
    isFixtureMainEventSlug("fifwc-mex-rsa-2026-06-11"),
    true,
  );
  assert.deepEqual(
    resolveFixtureSiblingSlugs("fifwc-mex-rsa-2026-06-11"),
    [
      "fifwc-mex-rsa-2026-06-11-more-markets",
      "fifwc-mex-rsa-2026-06-11-exact-score",
      "fifwc-mex-rsa-2026-06-11-halftime-result",
    ],
  );
  });

  it("ignores sibling event slugs", () => {
    assert.equal(
      isFixtureMainEventSlug("fifwc-mex-rsa-2026-06-11-more-markets"),
      false,
    );
    assert.deepEqual(
      resolveFixtureSiblingSlugs("fifwc-mex-rsa-2026-06-11-more-markets"),
      [],
    );
  });
});
