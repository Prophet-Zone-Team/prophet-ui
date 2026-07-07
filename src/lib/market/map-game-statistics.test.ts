import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapGameStatisticsGoalEvents,
  mapGameStatisticsRows,
  parseStatisticValue,
  resolveGoalElapsedSeconds,
  resolveMatchStoppageExtraMinutes
} from "@/lib/market/map-game-statistics";
import type { ProphetGameStatisticsPayload } from "@/types/prophet-api";

/** Inner JSON from GET /v1/game/statistics?slug=ucl-psg-ars-2026-05-30 */
const UCL_PSG_ARS_STATISTICS_JSON = `{"statistics":[{"team":{"id":85,"name":"Paris Saint Germain"},"statistics":[{"type":"Shots on Goal","value":4},{"type":"Shots off Goal","value":12},{"type":"Total Shots","value":21},{"type":"Blocked Shots","value":5},{"type":"Shots insidebox","value":12},{"type":"Shots outsidebox","value":9},{"type":"Fouls","value":11},{"type":"Corner Kicks","value":11},{"type":"Offsides","value":0},{"type":"Ball Possession","value":"75%"},{"type":"Yellow Cards","value":2},{"type":"Red Cards","value":null},{"type":"Goalkeeper Saves","value":0},{"type":"Total passes","value":889},{"type":"Passes accurate","value":809},{"type":"Passes %","value":"91%"},{"type":"expected_goals","value":"1.72"},{"type":"goals_prevented","value":"0.68"}]},{"team":{"id":42,"name":"Arsenal"},"statistics":[{"type":"Shots on Goal","value":1},{"type":"Shots off Goal","value":1},{"type":"Total Shots","value":7},{"type":"Blocked Shots","value":5},{"type":"Shots insidebox","value":5},{"type":"Shots outsidebox","value":2},{"type":"Fouls","value":17},{"type":"Corner Kicks","value":3},{"type":"Offsides","value":3},{"type":"Ball Possession","value":"25%"},{"type":"Yellow Cards","value":4},{"type":"Red Cards","value":null},{"type":"Goalkeeper Saves","value":3},{"type":"Total passes","value":285},{"type":"Passes accurate","value":196},{"type":"Passes %","value":"69%"},{"type":"expected_goals","value":"0.51"},{"type":"goals_prevented","value":"0.68"}]}],"events":[{"time":{"elapsed":6,"extra":null},"team":{"id":42,"name":"Arsenal"},"type":"Goal","detail":"Normal Goal"}]}`;

function parseGameStatisticsPayload(json: string): ProphetGameStatisticsPayload {
  const parsed = JSON.parse(json) as Partial<ProphetGameStatisticsPayload>;

  return {
    statistics: Array.isArray(parsed.statistics) ? parsed.statistics : [],
    events: Array.isArray(parsed.events) ? parsed.events : []
  };
}

/** Full events from GET /v1/game/statistics?slug=ucl-psg-ars-2026-05-30 */
const UCL_PSG_ARS_EVENTS_JSON = `[{"time":{"elapsed":6,"extra":null},"team":{"id":42,"name":"Arsenal"},"type":"Goal","detail":"Normal Goal"},{"time":{"elapsed":46,"extra":null},"team":{"id":42,"name":"Arsenal"},"type":"Card","detail":"Yellow Card"},{"time":{"elapsed":65,"extra":null},"team":{"id":85,"name":"Paris Saint Germain"},"type":"Goal","detail":"Penalty"},{"time":{"elapsed":90,"extra":6},"team":{"id":85,"name":"Paris Saint Germain"},"type":"Card","detail":"Yellow Card"}]`;

describe("map-game-statistics", () => {
  it("parseStatisticValue handles numbers, percentages, and null", () => {
    assert.equal(parseStatisticValue(21), 21);
    assert.equal(parseStatisticValue("75%"), 75);
    assert.equal(parseStatisticValue(null), 0);
    assert.equal(parseStatisticValue("1.72"), 1.72);
  });

  it("resolveMatchStoppageExtraMinutes returns positive announced extra minutes only", () => {
    assert.equal(resolveMatchStoppageExtraMinutes({ extra: 6 }), 6);
    assert.equal(resolveMatchStoppageExtraMinutes({ extra: 8 }), 8);
    assert.equal(resolveMatchStoppageExtraMinutes({ extra: 0 }), undefined);
    assert.equal(resolveMatchStoppageExtraMinutes({ extra: null }), undefined);
    assert.equal(resolveMatchStoppageExtraMinutes(undefined), undefined);
  });

  it("maps ucl-psg-ars-2026-05-30 statistics to UI rows for prophet team names", () => {
    const payload = parseGameStatisticsPayload(UCL_PSG_ARS_STATISTICS_JSON);
    const rows = mapGameStatisticsRows(
      payload,
      "Paris Saint-Germain FC",
      "Arsenal FC"
    );

    assert.equal(payload.statistics.length, 2);
    assert.equal(payload.events.length, 1);

    const byLabel = Object.fromEntries(rows.map((row) => [row.label, row]));

    assert.deepEqual(byLabel.Possession, {
      label: "Possession",
      homeValue: 75,
      awayValue: 25
    });
    assert.deepEqual(byLabel.Shots, {
      label: "Shots",
      homeValue: 21,
      awayValue: 7
    });
    assert.deepEqual(byLabel["Shots on Target"], {
      label: "Shots on Target",
      homeValue: 4,
      awayValue: 1
    });
    assert.deepEqual(byLabel["Shots off Target"], {
      label: "Shots off Target",
      homeValue: 12,
      awayValue: 1
    });
    assert.deepEqual(byLabel.Fouls, {
      label: "Fouls",
      homeValue: 11,
      awayValue: 17
    });
    assert.deepEqual(byLabel["Yellow Cards"], {
      label: "Yellow Cards",
      homeValue: 2,
      awayValue: 4
    });
    assert.deepEqual(byLabel["Red Cards"], {
      label: "Red Cards",
      homeValue: 0,
      awayValue: 0
    });
    assert.deepEqual(byLabel.Corners, {
      label: "Corners",
      homeValue: 11,
      awayValue: 3
    });
    assert.deepEqual(byLabel["Free Kicks"], {
      label: "Free Kicks",
      homeValue: 0,
      awayValue: 0
    });
  });

  it("maps ucl-psg-ars goal events and filters non-goal types", () => {
    const payload = parseGameStatisticsPayload(
      `{"statistics":[],"events":${UCL_PSG_ARS_EVENTS_JSON}}`
    );
    const goalEvents = mapGameStatisticsGoalEvents(
      payload,
      "Paris Saint-Germain FC",
      "Arsenal FC"
    );

    assert.deepEqual(goalEvents, [
      { elapsedSeconds: 360, side: "away", type: "goal" },
      { elapsedSeconds: 3900, side: "home", type: "goal" }
    ]);
  });

  it("resolveGoalElapsedSeconds converts match minutes to seconds", () => {
    assert.equal(resolveGoalElapsedSeconds(12, null), 720);
    assert.equal(resolveGoalElapsedSeconds(90, 6), 5760);
  });

  it("maps fif-hai-nzl goal at 12 minutes to 720 elapsedSeconds", () => {
    const payload = parseGameStatisticsPayload(
      `{"statistics":[],"events":[{"time":{"elapsed":12,"extra":null},"team":{"id":2386,"name":"Haiti"},"type":"Goal","detail":"Normal Goal"}]}`
    );
    const goalEvents = mapGameStatisticsGoalEvents(payload, "Haiti", "New Zealand");

    assert.deepEqual(goalEvents, [
      { elapsedSeconds: 720, side: "home", type: "goal" }
    ]);
  });

  it("maps USA goal events when UI uses United States as home label", () => {
    const payload = parseGameStatisticsPayload(
      `{"statistics":[],"events":[{"time":{"elapsed":7,"extra":null},"team":{"id":2384,"name":"USA"},"type":"Goal","detail":"Own Goal"},{"time":{"elapsed":31,"extra":null},"team":{"id":2384,"name":"USA"},"type":"Goal","detail":"Normal Goal"},{"time":{"elapsed":45,"extra":5},"team":{"id":2384,"name":"USA"},"type":"Goal","detail":"Normal Goal"}]}`
    );
    const goalEvents = mapGameStatisticsGoalEvents(
      payload,
      "United States",
      "Paraguay"
    );

    assert.deepEqual(goalEvents, [
      { elapsedSeconds: 420, side: "home", type: "goal" },
      { elapsedSeconds: 1860, side: "home", type: "goal" },
      { elapsedSeconds: 3000, side: "home", type: "goal" }
    ]);
  });

  it("includes stoppage time in goal elapsedSeconds", () => {
    const payload = parseGameStatisticsPayload(
      `{"statistics":[],"events":[{"time":{"elapsed":90,"extra":6},"team":{"id":42,"name":"Arsenal"},"type":"Goal","detail":"Normal Goal"}]}`
    );
    const goalEvents = mapGameStatisticsGoalEvents(
      payload,
      "Paris Saint-Germain FC",
      "Arsenal FC"
    );

    assert.deepEqual(goalEvents, [
      { elapsedSeconds: 5760, side: "away", type: "goal" }
    ]);
  });
});
