import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EventNotificationLevel } from "@/components/notification/event";
import { buildProphetNotificationSamples } from "@/data/mock/prophet-notifications";
import {
  buildNotificationDedupeKey,
  mapWsNotificationToEvent,
} from "@/lib/notification/map-ws-notification-to-event";
import type { ProphetNotificationData } from "@/types/prophet-notification-ws";

describe("mapWsNotificationToEvent", () => {
  it("maps score notifications to Goal layout with team scores", () => {
    const data: ProphetNotificationData = {
      notice_type: "score",
      event_slug: "world-cup-final",
      title: "Score Update",
      payload: {
        team_a_name: "Argentina",
        team_a_score: 2,
        team_b_name: "France",
        team_b_score: 1,
      },
    };

    const mapped = mapWsNotificationToEvent(data);

    assert.equal(mapped?.level, EventNotificationLevel.Goal);
    assert.equal(mapped?.teams.length, 2);
    assert.equal(mapped?.teams[0]?.score, "2");
    assert.equal(mapped?.teams[1]?.score, "1");
  });

  it("maps price notifications to Price single-card layout", () => {
    const data: ProphetNotificationData = {
      notice_type: "price",
      event_title: "World Cup Final",
      title: "Price alert",
      body: "Price moved",
      payload: {
        current: "0.58",
        baseline: "0.42",
      },
    };

    const mapped = mapWsNotificationToEvent(data);

    assert.equal(mapped?.level, EventNotificationLevel.Price);
    assert.equal(mapped?.teams[0]?.event, "Price alert");
  });

  it("maps all mock samples to event notification options", () => {
    const samples = buildProphetNotificationSamples(1_710_000_000);

    assert.equal(samples.length, 6);

    for (const sample of samples) {
      assert.ok(
        mapWsNotificationToEvent(sample),
        `expected mappable sample for ${sample.notice_type}`,
      );
    }
  });

  it("builds stable dedupe keys", () => {
    const data: ProphetNotificationData = {
      notice_type: "news",
      event_slug: "ucl-final",
      timestamp: 1710000000,
      payload: {},
    };

    assert.equal(
      buildNotificationDedupeKey(data),
      "news:ucl-final:1710000000",
    );
  });
});
