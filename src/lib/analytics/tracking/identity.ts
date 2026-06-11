const ANONYMOUS_ID_KEY = "prophet_anonymous_id";
const SESSION_ID_KEY = "prophet_session_id";
const SESSION_STARTED_AT_KEY = "prophet_session_started_at";

function createId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${uuid.replace(/-/g, "").slice(0, 12)}`;
}

export function getAnonymousId(): string {
  if (typeof window === "undefined") {
    return createId("anon");
  }

  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);

  if (existing) {
    return existing;
  }

  const next = createId("anon");
  window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
  return next;
}

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return createId("sess");
  }

  const existing = window.sessionStorage.getItem(SESSION_ID_KEY);

  if (existing) {
    return existing;
  }

  const next = createId("sess");
  const startedAt = new Date().toISOString();
  window.sessionStorage.setItem(SESSION_ID_KEY, next);
  window.sessionStorage.setItem(SESSION_STARTED_AT_KEY, startedAt);
  return next;
}

export function getSessionStartedAt(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.sessionStorage.getItem(SESSION_STARTED_AT_KEY) ?? undefined;
}

/** Eagerly create persistent analytics ids before the first event is sent. */
export function initializeAnalyticsIdentity(): {
  anonymousId: string;
  sessionId: string;
  sessionStartedAt?: string;
} {
  const anonymousId = getAnonymousId();
  const sessionId = getSessionId();
  const sessionStartedAt = getSessionStartedAt();

  return {
    anonymousId,
    sessionId,
    ...(sessionStartedAt ? { sessionStartedAt } : {})
  };
}
