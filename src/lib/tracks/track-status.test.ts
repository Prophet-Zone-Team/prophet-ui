import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildTrackRequest,
  buildUntrackRequest
} from "@/lib/tracks/track-status";
import {
  buildTrackStatusMapFromApiItems,
  resolveTrackStoreKeyFromApiItem,
  resolveTrackStoreKeyFromTarget
} from "@/lib/tracks/track-status-keys";
import type {
  ProphetUserTrackItem,
  ProphetUserTrackListItem
} from "@/types/prophet-api";

describe("track-status helpers", () => {
  it("resolves store keys from targets", () => {
    assert.equal(
      resolveTrackStoreKeyFromTarget({
        category: "team",
        slug: "brazil",
        teamName: "Brazil"
      }),
      "Brazil"
    );
    assert.equal(
      resolveTrackStoreKeyFromTarget({
        category: "game",
        slug: "fifwc-mex-rsa-2026-06-11",
        homeTeamName: "Mexico",
        awayTeamName: "South Africa"
      }),
      "fifwc-mex-rsa-2026-06-11"
    );
  });

  it("builds team track request with slug and team_name", () => {
    assert.deepEqual(
      buildTrackRequest({
        category: "team",
        slug: "brazil",
        teamName: "Brazil"
      }),
      {
        category: "team",
        slug: "brazil",
        team_name: "Brazil"
      }
    );
  });

  it("builds game track request with slug and comma-separated team_name", () => {
    assert.deepEqual(
      buildTrackRequest({
        category: "game",
        slug: "fifwc-mex-rsa-2026-06-11",
        homeTeamName: "Mexico",
        awayTeamName: "South Africa"
      }),
      {
        category: "game",
        slug: "fifwc-mex-rsa-2026-06-11",
        team_name: "Mexico,South Africa"
      }
    );
  });

  it("builds untrack request with slug only", () => {
    assert.deepEqual(
      buildUntrackRequest({
        category: "team",
        slug: "brazil",
        teamName: "Brazil"
      }),
      { slug: "brazil" }
    );
    assert.deepEqual(
      buildUntrackRequest({
        category: "game",
        slug: "fifwc-mex-rsa-2026-06-11",
        homeTeamName: "Mexico",
        awayTeamName: "South Africa"
      }),
      { slug: "fifwc-mex-rsa-2026-06-11" }
    );
  });

  it("resolves list API item keys by team_name or slug", () => {
    assert.equal(
      resolveTrackStoreKeyFromApiItem({
        category: "team",
        slug: "brazil",
        team_name: "Brazil"
      } satisfies ProphetUserTrackListItem),
      "Brazil"
    );
    assert.equal(
      resolveTrackStoreKeyFromApiItem({
        category: "game",
        slug: "fifwc-mex-rsa-2026-06-11"
      } satisfies ProphetUserTrackListItem),
      "fifwc-mex-rsa-2026-06-11"
    );
  });

  it("resolves API item keys by team_name or slug", () => {
    assert.equal(
      resolveTrackStoreKeyFromApiItem({
        team_name: "Brazil",
        category: "team"
      } satisfies ProphetUserTrackItem),
      "Brazil"
    );
    assert.equal(
      resolveTrackStoreKeyFromApiItem({
        slug: "fifwc-mex-rsa-2026-06-11",
        category: "game",
        goals: [1, 0]
      } satisfies ProphetUserTrackItem),
      "fifwc-mex-rsa-2026-06-11"
    );
  });

  it("builds status map from API items", () => {
    assert.deepEqual(
      buildTrackStatusMapFromApiItems([
        { team_name: "Brazil", category: "team" },
        { slug: "fifwc-mex-rsa-2026-06-11", category: "game", goals: [1] }
      ]),
      {
        Brazil: true,
        "fifwc-mex-rsa-2026-06-11": true
      }
    );
  });
});
