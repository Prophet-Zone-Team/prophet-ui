import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseProphetWsNotificationMessage } from "@/lib/notification/parse-prophet-ws-message";

describe("parseProphetWsNotificationMessage", () => {
  it("parses notification envelopes", () => {
    const parsed = parseProphetWsNotificationMessage({
      type: "notification",
      data: {
        notice_type: "volume",
        event_slug: "world-cup-final",
        title: "Volume alert",
        payload: {
          current_volume_usd: "250000",
        },
      },
    });

    assert.equal(parsed?.type, "notification");
    assert.equal(parsed?.data.notice_type, "volume");
    assert.equal(parsed?.data.event_slug, "world-cup-final");
  });

  it("ignores non-notification messages", () => {
    assert.equal(
      parseProphetWsNotificationMessage({ type: "ping" }),
      undefined,
    );
  });
});
