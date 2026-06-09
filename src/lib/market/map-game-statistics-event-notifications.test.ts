import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EventNotificationLevel } from "@/components/notification/event";
import {
  buildGameStatisticsEventDedupeKey,
  mapGameStatisticsEventNotifications,
} from "@/lib/market/map-game-statistics-event-notifications";
import type { ProphetGameStatisticsPayload } from "@/types/prophet-api";

const UCL_PSG_ARS_EVENTS_JSON = `[{"time":{"elapsed":6,"extra":null},"team":{"id":42,"name":"Arsenal"},"type":"Goal","detail":"Normal Goal"},{"time":{"elapsed":46,"extra":null},"team":{"id":42,"name":"Arsenal"},"type":"Card","detail":"Yellow Card"},{"time":{"elapsed":65,"extra":null},"team":{"id":85,"name":"Paris Saint Germain"},"type":"Goal","detail":"Penalty"},{"time":{"elapsed":90,"extra":6},"team":{"id":85,"name":"Paris Saint Germain"},"type":"Card","detail":"Yellow Card"}]`;

function parseGameStatisticsPayload(json: string): ProphetGameStatisticsPayload {
  const parsed = JSON.parse(json) as Partial<ProphetGameStatisticsPayload>;

  return {
    statistics: Array.isArray(parsed.statistics) ? parsed.statistics : [],
    events: Array.isArray(parsed.events) ? parsed.events : [],
  };
}

describe("mapGameStatisticsEventNotifications", () => {
  it("maps goal and card events with cumulative scores", () => {
    const payload = parseGameStatisticsPayload(
      `{"statistics":[],"events":${UCL_PSG_ARS_EVENTS_JSON}}`,
    );
    const notifications = mapGameStatisticsEventNotifications(
      payload,
      "Paris Saint-Germain FC",
      "Arsenal FC",
      "ucl-psg-ars",
    );

    assert.equal(notifications.length, 4);

    assert.equal(notifications[0]?.options.level, EventNotificationLevel.Goal);
    assert.equal(notifications[0]?.options.teams[0]?.score, "0");
    assert.equal(notifications[0]?.options.teams[1]?.score, "1");
    assert.equal(notifications[0]?.options.teams[1]?.event, "goal");

    assert.equal(
      notifications[1]?.options.level,
      EventNotificationLevel.FoulWarn,
    );
    assert.equal(notifications[1]?.options.teams[0]?.score, "0");
    assert.equal(notifications[1]?.options.teams[1]?.score, "1");
    assert.equal(notifications[1]?.options.teams[1]?.event, "foul");

    assert.equal(notifications[2]?.options.level, EventNotificationLevel.Goal);
    assert.equal(notifications[2]?.options.teams[0]?.score, "1");
    assert.equal(notifications[2]?.options.teams[1]?.score, "1");
    assert.equal(notifications[2]?.options.teams[0]?.event, "goal");

    assert.equal(
      notifications[3]?.options.level,
      EventNotificationLevel.FoulWarn,
    );
    assert.equal(notifications[3]?.options.teams[0]?.score, "1");
    assert.equal(notifications[3]?.options.teams[1]?.score, "1");
    assert.equal(notifications[3]?.options.teams[0]?.event, "foul");
  });

  it("maps red cards to FoulAlert", () => {
    const payload = parseGameStatisticsPayload(
      `{"statistics":[],"events":[{"time":{"elapsed":70,"extra":null},"team":{"id":42,"name":"Arsenal"},"type":"Card","detail":"Red Card"}]}`,
    );
    const notifications = mapGameStatisticsEventNotifications(
      payload,
      "Paris Saint-Germain FC",
      "Arsenal FC",
      "ucl-psg-ars",
    );

    assert.equal(notifications.length, 1);
    assert.equal(
      notifications[0]?.options.level,
      EventNotificationLevel.FoulAlert,
    );
    assert.equal(notifications[0]?.options.teams[1]?.event, "foul");
  });

  it("filters unsupported event types", () => {
    const payload = parseGameStatisticsPayload(
      `{"statistics":[],"events":[{"time":{"elapsed":12,"extra":null},"team":{"id":42,"name":"Arsenal"},"type":"subst","detail":"Substitution 1"}]}`,
    );
    const notifications = mapGameStatisticsEventNotifications(
      payload,
      "Paris Saint-Germain FC",
      "Arsenal FC",
      "ucl-psg-ars",
    );

    assert.deepEqual(notifications, []);
  });

  it("builds stable dedupe keys", () => {
    const payload = parseGameStatisticsPayload(
      `{"statistics":[],"events":${UCL_PSG_ARS_EVENTS_JSON}}`,
    );
    const event = payload.events[0];

    assert.ok(event);
    assert.equal(
      buildGameStatisticsEventDedupeKey(event, "ucl-psg-ars"),
      "ucl-psg-ars:6:0:42:Goal:Normal Goal",
    );
  });
});
