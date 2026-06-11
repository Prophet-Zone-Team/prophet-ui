import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  resolveAmountBucket,
  resolvePriceBucket,
  resolveSizeBucket
} from "@/lib/analytics/tracking/buckets";
import { resetAnalyticsTrackingContextForTests } from "@/lib/analytics/tracking/context";
import {
  getAnonymousId,
  getSessionId,
  initializeAnalyticsIdentity
} from "@/lib/analytics/tracking/identity";
import { resolveAnalyticsPagePath } from "@/lib/analytics/tracking/resolve-page-path";
import { resolveAnalyticsEnvironment } from "@/lib/analytics/tracking/resolve-environment";
import {
  shouldSkipDuplicatePageView,
  trackPageViewed
} from "@/lib/analytics/tracking/page-view";
import {
  resolveAnalyticsThrottleKey,
  shouldSkipThrottledAnalyticsEvent
} from "@/lib/analytics/tracking/event-throttle";
import {
  ANALYTICS_TRACK_BATCH_SIZE,
  flushAnalyticsTransportQueueForTests,
  getAnalyticsTransportQueueDepthForTests,
  isAnalyticsFlushScheduledForTests,
  isAnalyticsTransportProcessingForTests
} from "@/lib/analytics/tracking/transport-queue";
import { trackOrderInputChanged } from "@/lib/analytics/tracking/trade-events";
import { trackAnalyticsEvent } from "@/lib/analytics/tracking/track";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

describe("analytics tracking", () => {
  afterEach(() => {
    resetAnalyticsTrackingContextForTests();
  });

  it("initializes analytics identity eagerly", () => {
    const localStorage = new MemoryStorage();
    const sessionStorage = new MemoryStorage();

    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage,
        sessionStorage
      }
    });

    try {
      const identity = initializeAnalyticsIdentity();

      assert.match(identity.anonymousId, /^anon_/);
      assert.match(identity.sessionId, /^sess_/);
      assert.equal(localStorage.getItem("prophet_anonymous_id"), identity.anonymousId);
      assert.equal(sessionStorage.getItem("prophet_session_id"), identity.sessionId);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
    }
  });

  it("dedupes page_viewed for the same path within a short window", () => {
    assert.equal(shouldSkipDuplicatePageView("/fifa"), false);
    assert.equal(shouldSkipDuplicatePageView("/fifa"), true);
    assert.equal(shouldSkipDuplicatePageView("/tracks"), false);
    assert.equal(shouldSkipDuplicatePageView("/fifa"), false);
  });

  it("trackPageViewed does not throw on duplicate path", () => {
    const originalWindow = globalThis.window;
    const originalFetch = globalThis.fetch;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/fifa", search: "", hostname: "localhost" },
        localStorage: new MemoryStorage(),
        sessionStorage: new MemoryStorage()
      }
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: () => Promise.resolve(new Response())
    });

    try {
      assert.doesNotThrow(() => {
        trackPageViewed("/fifa");
        trackPageViewed("/fifa");
      });
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        value: originalFetch
      });
    }
  });

  it("falls back to window.location when pathname is null", () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/fifa" }
      }
    });

    try {
      assert.equal(resolveAnalyticsPagePath(null), "/fifa");
      assert.equal(resolveAnalyticsPagePath(undefined), "/fifa");
      assert.equal(resolveAnalyticsPagePath("/tracks"), "/tracks");
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
    }
  });

  it("persists anonymous and session ids", () => {
    const localStorage = new MemoryStorage();
    const sessionStorage = new MemoryStorage();

    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage,
        sessionStorage
      }
    });

    try {
      const anonymousId = getAnonymousId();
      const sessionId = getSessionId();

      assert.match(anonymousId, /^anon_/);
      assert.match(sessionId, /^sess_/);
      assert.equal(getAnonymousId(), anonymousId);
      assert.equal(getSessionId(), sessionId);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
    }
  });

  it("resolves environment buckets", () => {
    assert.equal(resolvePriceBucket(0.05), "0-0.10");
    assert.equal(resolvePriceBucket(0.65), "0.50-0.70");
    assert.equal(resolveAmountBucket(25), "10-50");
    assert.equal(resolveSizeBucket(600), "500+");
  });

  it("resolves local environment on localhost", () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { hostname: "localhost" }
      }
    });

    try {
      assert.equal(resolveAnalyticsEnvironment(), "local");
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
    }
  });

  it("throttles repeated events of the same type within 5 seconds", () => {
    const key = resolveAnalyticsThrottleKey({ eventName: "market_tab_changed" });

    assert.equal(shouldSkipThrottledAnalyticsEvent(key), false);
    assert.equal(shouldSkipThrottledAnalyticsEvent(key), true);
  });

  it("skips order_input_changed when the changed value is zero", () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/trade", search: "", hostname: "localhost" },
        localStorage: new MemoryStorage(),
        sessionStorage: new MemoryStorage()
      }
    });

    try {
      trackOrderInputChanged({
        changedField: "amount",
        amount: 0
      });

      assert.equal(getAnalyticsTransportQueueDepthForTests(), 0);
      assert.equal(isAnalyticsTransportProcessingForTests(), false);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
    }
  });

  it("throttles changed events by event name only", () => {
    const keyA = resolveAnalyticsThrottleKey({
      eventName: "order_input_changed",
      dedupeKey: "price"
    });
    const keyB = resolveAnalyticsThrottleKey({
      eventName: "order_input_changed",
      dedupeKey: "size"
    });

    assert.equal(keyA, "order_input_changed");
    assert.equal(keyB, "order_input_changed");
    assert.equal(shouldSkipThrottledAnalyticsEvent(keyA), false);
    assert.equal(shouldSkipThrottledAnalyticsEvent(keyB), true);
  });

  it("allows distinct impression dedupe keys within the throttle window", () => {
    const keyA = resolveAnalyticsThrottleKey({
      eventName: "team_card_impressed",
      dedupeKey: "team-a"
    });
    const keyB = resolveAnalyticsThrottleKey({
      eventName: "team_card_impressed",
      dedupeKey: "team-b"
    });

    assert.equal(shouldSkipThrottledAnalyticsEvent(keyA), false);
    assert.equal(shouldSkipThrottledAnalyticsEvent(keyB), false);
  });

  it("waits for the flush interval before sending queued analytics events", async () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/fifa", search: "", hostname: "localhost" },
        localStorage: new MemoryStorage(),
        sessionStorage: new MemoryStorage()
      }
    });

    try {
      trackAnalyticsEvent({
        eventName: "page_viewed",
        eventId: "event-1"
      });

      assert.equal(getAnalyticsTransportQueueDepthForTests(), 1);
      assert.equal(isAnalyticsFlushScheduledForTests(), true);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
    }
  });

  it("batches queued analytics events up to five per request", async () => {
    const originalWindow = globalThis.window;
    const originalFetch = globalThis.fetch;
    const requestBodies: Array<Array<{ eventId: string }> | undefined> = [];
    let activeRequests = 0;
    let maxConcurrentRequests = 0;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/fifa", search: "", hostname: "localhost" },
        localStorage: new MemoryStorage(),
        sessionStorage: new MemoryStorage()
      }
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: (_input: RequestInfo | URL, init?: RequestInit) => {
        const body =
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as { list?: Array<{ eventId: string }> }).list
            : undefined;

        requestBodies.push(body);
        activeRequests += 1;
        maxConcurrentRequests = Math.max(maxConcurrentRequests, activeRequests);

        return new Promise<Response>((resolve) => {
          setTimeout(() => {
            activeRequests -= 1;
            resolve(new Response());
          }, 10);
        });
      }
    });

    try {
      trackAnalyticsEvent({
        eventName: "page_viewed",
        eventId: "event-1"
      });
      trackAnalyticsEvent({
        eventName: "market_data_loaded",
        eventId: "event-2"
      });
      trackAnalyticsEvent({
        eventName: "section_viewed",
        eventId: "event-3"
      });

      await flushAnalyticsTransportQueueForTests();

      assert.equal(maxConcurrentRequests, 1);
      assert.equal(requestBodies.length, 1);
      assert.equal(requestBodies[0]?.length, 3);
      assert.deepEqual(
        requestBodies[0]?.map((item) => item.eventId),
        ["event-1", "event-2", "event-3"]
      );
      assert.equal(getAnalyticsTransportQueueDepthForTests(), 0);
      assert.equal(isAnalyticsTransportProcessingForTests(), false);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        value: originalFetch
      });
    }
  });

  it("sends overflow analytics events in subsequent batches", async () => {
    const originalWindow = globalThis.window;
    const originalFetch = globalThis.fetch;
    const batchSizes: number[] = [];

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/fifa", search: "", hostname: "localhost" },
        localStorage: new MemoryStorage(),
        sessionStorage: new MemoryStorage()
      }
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: (_input: RequestInfo | URL, init?: RequestInit) => {
        const body =
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as { list?: unknown[] }).list
            : undefined;

        batchSizes.push(body?.length ?? 0);

        return Promise.resolve(new Response());
      }
    });

    const eventNames = [
      "page_viewed",
      "market_data_loaded",
      "section_viewed",
      "chart_viewed",
      "team_card_impressed",
      "nav_clicked"
    ] as const;

    try {
      for (let index = 0; index < ANALYTICS_TRACK_BATCH_SIZE + 1; index += 1) {
        trackAnalyticsEvent({
          eventName: eventNames[index],
          eventId: `event-${index + 1}`,
          dedupeKey: `overflow-test-${index + 1}`
        });
      }

      await flushAnalyticsTransportQueueForTests();

      assert.deepEqual(batchSizes, [ANALYTICS_TRACK_BATCH_SIZE, 1]);
      assert.equal(getAnalyticsTransportQueueDepthForTests(), 0);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        value: originalFetch
      });
    }
  });

  it("does not throw when transport fails", () => {
    const originalWindow = globalThis.window;
    const originalNavigator = globalThis.navigator;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/fifa", search: "" },
        localStorage: new MemoryStorage(),
        sessionStorage: new MemoryStorage()
      }
    });

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {}
    });

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { referrer: "" }
    });

    try {
      assert.doesNotThrow(() => {
        trackAnalyticsEvent({
          eventName: "page_viewed",
          eventId: "test-event-id"
        });
      });
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow
      });
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: originalNavigator
      });
    }
  });
});
