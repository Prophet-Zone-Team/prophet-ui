export interface CronAlertPayload {
  title: string;
  severity: "warning" | "critical";
  source: "scheduled-collection";
  message: string;
  occurredAt: string;
  details?: unknown;
}

interface ScheduledCollectionResults {
  market?: Array<{
    source?: string;
    count?: number;
    universe?: {
      trackedMarketCount?: number;
      missingTeamCount?: number;
    };
  }>;
  signal?: Array<{
    source?: string;
    status?: string;
    count?: number;
    errors?: string[];
  }>;
}

const EXPECTED_POLYMARKET_TEAM_COUNT = 48;

export function getScheduledCollectionIssues(results: ScheduledCollectionResults): string[] {
  const issues: string[] = [];

  for (const marketResult of results.market ?? []) {
    if (marketResult.source === "polymarket") {
      const trackedMarketCount = marketResult.universe?.trackedMarketCount;
      const missingTeamCount = marketResult.universe?.missingTeamCount;

      if (trackedMarketCount !== undefined && trackedMarketCount < EXPECTED_POLYMARKET_TEAM_COUNT) {
        issues.push(`Polymarket tracked market count is ${trackedMarketCount}/${EXPECTED_POLYMARKET_TEAM_COUNT}.`);
      }

      if (missingTeamCount !== undefined && missingTeamCount > 0) {
        issues.push(`Polymarket market universe is missing ${missingTeamCount} teams.`);
      }
    }
  }

  for (const signalResult of results.signal ?? []) {
    if (signalResult.status === "error") {
      const errorDetail = signalResult.errors?.length ? ` ${signalResult.errors.join(" | ")}` : "";
      issues.push(`${signalResult.source ?? "signal"} collection returned error.${errorDetail}`);
    }
  }

  return issues;
}

export async function sendCronAlert(payload: CronAlertPayload): Promise<void> {
  const webhookUrl = process.env.CRON_ALERT_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const bearer = process.env.CRON_ALERT_WEBHOOK_BEARER?.trim();

  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Cron alert webhook returned ${response.status}.`);
  }
}

export function createScheduledCollectionAlert({
  severity,
  message,
  details,
}: {
  severity: CronAlertPayload["severity"];
  message: string;
  details?: unknown;
}): CronAlertPayload {
  return {
    title: "World Cup terminal scheduled collection issue",
    severity,
    source: "scheduled-collection",
    message,
    occurredAt: new Date().toISOString(),
    details,
  };
}
