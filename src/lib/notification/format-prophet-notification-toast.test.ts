import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildProphetNotificationSamples } from "@/data/mock/prophet-notifications";
import { formatProphetNotificationToast } from "@/lib/notification/format-prophet-notification-toast";
import type { ProphetNotificationData } from "@/types/prophet-notification-ws";

describe("formatProphetNotificationToast", () => {
  it("formats match_preview with VS header and local start time", () => {
    const data: ProphetNotificationData = {
      notice_type: "match_preview",
      event_title: "World Cup Winner",
      body: "Kickoff: 17:00 UTC",
      payload: {
        team_a: "Brazil",
        team_b: "Argentina",
        match_start: "2026-06-11T17:00:00Z",
      },
    };

    const formatted = formatProphetNotificationToast(data);

    assert.equal(formatted?.variant, "match_preview");
    assert.equal(formatted?.title, "Brazil VS Argentina");
    assert.equal(formatted?.titleLayout, "match_vs");
    assert.match(
      formatted?.description ?? "",
      /^will start on [A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}:\d{2}$/,
    );
    assert.deepEqual(formatted?.teamNames, ["Brazil", "Argentina"]);
    assert.equal(formatted?.duration, 8_000);
  });

  it("formats price with world cup question title", () => {
    const data: ProphetNotificationData = {
      notice_type: "price",
      market_name: "Argentina",
      outcome: "YES",
      payload: {
        baseline: "0.42",
        baseline_display: "42%",
        current: "0.58",
        current_display: "58%",
        change_abs: "0.16",
        change_abs_display: "+16pp",
      },
    };

    const formatted = formatProphetNotificationToast(data);

    assert.equal(
      formatted?.title,
      "Will Argentina win the 2026 FIFA World Cup? YES",
    );
    assert.deepEqual(formatted?.titleParts, [
      { text: "Will Argentina win the 2026 FIFA World Cup? " },
      { text: "YES", outcomeTone: "yes" },
    ]);
    assert.equal(formatted?.description, "42% → 58% (+16pp)");
    assert.deepEqual(formatted?.descriptionParts, [
      { text: "42% → 58% (" },
      { text: "+16pp", changeHighlight: true },
      { text: ")" },
    ]);
    assert.deepEqual(formatted?.teamNames, ["Argentina"]);
    assert.equal(formatted?.changeDirection, "up");
  });

  it("colors NO outcome on the title line", () => {
    const data: ProphetNotificationData = {
      notice_type: "price",
      market_name: "Argentina",
      outcome: "NO",
      payload: {
        baseline_display: "58%",
        current_display: "42%",
        change_abs_display: "-16pp",
        change_abs: "-0.16",
      },
    };

    const formatted = formatProphetNotificationToast(data);

    assert.deepEqual(formatted?.titleParts?.[1], {
      text: "NO",
      outcomeTone: "no",
    });
  });

  it("omits team flag for Draw price markets", () => {
    const data: ProphetNotificationData = {
      notice_type: "price",
      market_name: "Draw",
      outcome: "YES",
      payload: {
        baseline_display: "25%",
        current_display: "30%",
        change_abs_display: "+5pp",
        change_abs: "0.05",
      },
    };

    const formatted = formatProphetNotificationToast(data);

    assert.equal(
      formatted?.title,
      "Will this match end in a draw at the 2026 FIFA World Cup? YES",
    );
    assert.deepEqual(formatted?.titleParts?.[1], {
      text: "YES",
      outcomeTone: "yes",
    });
    assert.deepEqual(formatted?.teamNames, []);
  });

  it("formats volume with colloquial title and accented delta", () => {
    const data: ProphetNotificationData = {
      notice_type: "volume",
      event_title: "World Cup Winner",
      payload: {
        delta_usd: "130000",
        delta_usd_display: "130K",
        previous_volume_usd_display: "120K",
        current_volume_usd_display: "250K",
      },
    };

    const formatted = formatProphetNotificationToast(data);

    assert.equal(formatted?.title, "Trading picked up on World Cup Winner");
    assert.equal(formatted?.description, "(120K → 250K) +130K");
    assert.deepEqual(formatted?.descriptionParts, [
      { text: "(120K → 250K) " },
      { text: "+130K", accent: true },
    ]);
    assert.deepEqual(formatted?.teamNames, []);
  });

  it("formats large_order with shared question title and accented notional", () => {
    const data: ProphetNotificationData = {
      notice_type: "large_order",
      market_name: "Brazil",
      outcome: "YES",
      payload: {
        side: "BUY",
        notional_usd_display: "5.8K",
        price: "0.58",
      },
    };

    const formatted = formatProphetNotificationToast(data);

    assert.equal(
      formatted?.title,
      "Will Brazil win the 2026 FIFA World Cup? YES",
    );
    assert.deepEqual(formatted?.titleParts, [
      { text: "Will Brazil win the 2026 FIFA World Cup? " },
      { text: "YES", outcomeTone: "yes" },
    ]);
    assert.equal(formatted?.description, "BUY 5.8K @ 0.58");
    assert.deepEqual(formatted?.descriptionParts, [
      { text: "BUY " },
      { text: "5.8K", accent: true },
      { text: " @ 0.58" },
    ]);
    assert.deepEqual(formatted?.teamNames, ["Brazil"]);
  });

  it("formats all mock toast samples", () => {
    const samples = buildProphetNotificationSamples(1_710_000_000);

    assert.equal(samples.length, 4);

    for (const sample of samples) {
      const formatted = formatProphetNotificationToast(sample);

      assert.ok(formatted, `expected ${sample.notice_type} to format`);
      assert.equal(formatted.variant, sample.notice_type);
    }
  });

  it("returns undefined for unsupported notice types", () => {
    const data: ProphetNotificationData = {
      notice_type: "score",
      payload: {
        team_a_name: "Brazil",
        team_b_name: "Argentina",
      },
    };

    assert.equal(formatProphetNotificationToast(data), undefined);
  });
});
