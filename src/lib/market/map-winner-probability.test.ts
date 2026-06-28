import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatWinnerProbabilityLabel,
  mapWinnerProbabilityByTeamId,
} from "@/lib/market/map-winner-probability";
import type { ProphetGetWinnerProbabilityData } from "@/types/prophet-api";

describe("formatWinnerProbabilityLabel", () => {
  it("formats decimal percent values with up to two decimals", () => {
    assert.equal(formatWinnerProbabilityLabel(13.85), "13.85%");
    assert.equal(formatWinnerProbabilityLabel(19.75), "19.75%");
    assert.equal(formatWinnerProbabilityLabel(0.05), "0.05%");
    assert.equal(formatWinnerProbabilityLabel(0), "0%");
  });
});

describe("mapWinnerProbabilityByTeamId", () => {
  it("maps API decimals to team ids on a 0-100 scale", () => {
    const data: ProphetGetWinnerProbabilityData = [
      { team: "Spain", probability: "0.1385" },
      { team: "France", probability: "0.1975" },
      { team: "Haiti", probability: "0" },
    ];

    const map = mapWinnerProbabilityByTeamId(data);

    assert.equal(map.get("spain"), 13.85);
    assert.equal(map.get("france"), 19.75);
    assert.equal(map.get("haiti"), 0);
  });

  it("skips empty probabilities and unmapped teams", () => {
    const data: ProphetGetWinnerProbabilityData = [
      { team: "Other", probability: "" },
      { team: "Italy", probability: "0" },
      { team: "Peru", probability: "0" },
    ];

    const map = mapWinnerProbabilityByTeamId(data);

    assert.equal(map.size, 0);
  });

  it("maps API alias team names", () => {
    const data: ProphetGetWinnerProbabilityData = [
      { team: "Bosnia-Herzegovina", probability: "0.0005" },
      { team: "Cape Verde", probability: "0.0005" },
      { team: "Ivory Coast", probability: "0.0035" },
      { team: "USA", probability: "0.0355" },
    ];

    const map = mapWinnerProbabilityByTeamId(data);

    assert.equal(map.get("bosnia-herzegovina"), 0.05);
    assert.equal(map.get("cape-verde"), 0.05);
    assert.equal(map.get("ivory-coast"), 0.35);
    assert.equal(map.get("usa"), 3.55);
    assert.equal(map.has("bosnia-and-herzegovina"), false);
  });

  it("returns an empty map for undefined data", () => {
    assert.equal(mapWinnerProbabilityByTeamId(undefined).size, 0);
  });
});
