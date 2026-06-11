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
