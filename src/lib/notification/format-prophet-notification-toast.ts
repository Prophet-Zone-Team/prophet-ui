import type {
  ProphetNotificationData,
  ProphetToastNoticeType,
} from "@/types/prophet-notification-ws";

export type ProphetNotificationToastChangeDirection = "up" | "down" | "flat";

export type ProphetNotificationToastDescriptionPart = {
  text: string;
  accent?: boolean;
  changeHighlight?: boolean;
};

export type ProphetNotificationToastTitlePart = {
  text: string;
  outcomeTone?: "yes" | "no";
};

export interface ProphetNotificationToastContent {
  variant: ProphetToastNoticeType;
  title: string;
  titleParts?: ProphetNotificationToastTitlePart[];
  description: string;
  descriptionParts?: ProphetNotificationToastDescriptionPart[];
  teamNames: string[];
  titleLayout?: "default" | "match_vs";
  changeDirection?: ProphetNotificationToastChangeDirection;
  duration: number;
}

const TOAST_DURATION_MS: Record<ProphetToastNoticeType, number> = {
  match_preview: 8_000,
  price: 5_000,
  volume: 5_000,
  large_order: 6_000,
};

const WORLD_CUP_EVENT_LABEL = "2026 FIFA World Cup";

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function parseNumeric(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatOutcomeLabel(outcome: string | undefined): string {
  const normalized = readNonEmptyString(outcome)?.toUpperCase();

  if (normalized === "YES" || normalized === "NO") {
    return normalized;
  }

  return normalized ?? "—";
}

function formatProbabilityDisplay(
  value: string | undefined,
  display: string | undefined,
): string {
  if (display) {
    return display;
  }

  const numeric = parseNumeric(value);

  if (numeric === undefined) {
    return "—";
  }

  return `${Math.round(numeric * 100)}%`;
}

function formatChangeAbsDisplay(
  value: string | undefined,
  display: string | undefined,
): string {
  if (display) {
    return display.startsWith("+") || display.startsWith("-")
      ? display
      : `+${display}`;
  }

  const numeric = parseNumeric(value);

  if (numeric === undefined) {
    return "—";
  }

  const points = Math.round(Math.abs(numeric) * 100);
  const sign = numeric > 0 ? "+" : numeric < 0 ? "-" : "";

  return `${sign}${points}pp`;
}

function formatCompactUsdDisplay(
  value: string | undefined,
  display: string | undefined,
): string | undefined {
  if (display) {
    return display;
  }

  const numeric = parseNumeric(value);

  if (numeric === undefined) {
    return undefined;
  }

  const absolute = Math.abs(numeric);

  if (absolute >= 1_000_000) {
    return `${(absolute / 1_000_000).toFixed(1)}M`;
  }

  if (absolute >= 1_000) {
    const compact = absolute / 1_000;
    return compact >= 10
      ? `${Math.round(compact)}K`
      : `${compact.toFixed(1)}K`;
  }

  return `${Math.round(absolute)}`;
}

function resolveChangeDirection(
  changeAbs: string | undefined,
): ProphetNotificationToastChangeDirection {
  const numeric = parseNumeric(changeAbs);

  if (numeric === undefined || numeric === 0) {
    return "flat";
  }

  return numeric > 0 ? "up" : "down";
}

function resolveTeamNamesForMarket(marketName: string | undefined): string[] {
  const name = readNonEmptyString(marketName);

  if (!name || name.toLowerCase() === "draw") {
    return [];
  }

  return [name];
}

function formatMarketQuestionTitle(marketName: string): string {
  if (marketName.toLowerCase() === "draw") {
    return `Will this match end in a draw at the ${WORLD_CUP_EVENT_LABEL}?`;
  }

  return `Will ${marketName} win the ${WORLD_CUP_EVENT_LABEL}?`;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatLocalKickoffLabel(
  matchStart: string | undefined,
  body: string | undefined,
): string {
  const iso = readNonEmptyString(matchStart);

  if (iso) {
    const date = new Date(iso);

    if (!Number.isNaN(date.getTime())) {
      const month = MONTH_LABELS[date.getMonth()];
      const day = date.getDate();
      const hh = pad2(date.getHours());
      const min = pad2(date.getMinutes());
      const ss = pad2(date.getSeconds());

      return `${month} ${day} ${hh}:${min}:${ss}`;
    }
  }

  const bodyText = readNonEmptyString(body);

  if (bodyText) {
    return bodyText.replace(/^Kickoff:\s*/i, "");
  }

  return "—";
}

function formatMatchPreviewToast(
  data: Extract<ProphetNotificationData, { notice_type: "match_preview" }>,
): ProphetNotificationToastContent | undefined {
  const payload = data.payload;
  const teamA = readNonEmptyString(payload.team_a);
  const teamB = readNonEmptyString(payload.team_b);
  const kickoff = formatLocalKickoffLabel(payload.match_start, data.body);

  if (!teamA || !teamB) {
    return undefined;
  }

  const description = `will start on ${kickoff}`;

  return {
    variant: "match_preview",
    title: `${teamA} VS ${teamB}`,
    description,
    teamNames: [teamA, teamB],
    titleLayout: "match_vs",
    duration: TOAST_DURATION_MS.match_preview,
  };
}

function resolveOutcomeTone(
  outcome: string,
): "yes" | "no" | undefined {
  if (outcome === "YES") {
    return "yes";
  }

  if (outcome === "NO") {
    return "no";
  }

  return undefined;
}

function formatPriceToast(
  data: Extract<ProphetNotificationData, { notice_type: "price" }>,
): ProphetNotificationToastContent | undefined {
  const payload = data.payload;
  const marketName = readNonEmptyString(data.market_name) ?? "Market";
  const outcome = formatOutcomeLabel(data.outcome);
  const baselineDisplay = formatProbabilityDisplay(
    payload.baseline,
    payload.baseline_display,
  );
  const currentDisplay = formatProbabilityDisplay(
    payload.current,
    payload.current_display,
  );
  const changeDisplay = formatChangeAbsDisplay(
    payload.change_abs,
    payload.change_abs_display,
  );
  const questionTitle = formatMarketQuestionTitle(marketName);
  const description = `${baselineDisplay} → ${currentDisplay} (${changeDisplay})`;
  const outcomeTone = resolveOutcomeTone(outcome);

  return {
    variant: "price",
    title: `${questionTitle} ${outcome}`,
    titleParts: [
      { text: `${questionTitle} ` },
      ...(outcomeTone
        ? [{ text: outcome, outcomeTone }]
        : [{ text: outcome }]),
    ],
    description,
    descriptionParts: [
      { text: `${baselineDisplay} → ${currentDisplay} (` },
      { text: changeDisplay, changeHighlight: true },
      { text: ")" },
    ],
    teamNames: resolveTeamNamesForMarket(marketName),
    changeDirection: resolveChangeDirection(payload.change_abs),
    duration: TOAST_DURATION_MS.price,
  };
}

function formatVolumeToast(
  data: Extract<ProphetNotificationData, { notice_type: "volume" }>,
): ProphetNotificationToastContent | undefined {
  const payload = data.payload;
  const eventTitle = readNonEmptyString(data.event_title) ?? "this market";
  const deltaDisplay = formatCompactUsdDisplay(
    payload.delta_usd,
    payload.delta_usd_display,
  );
  const previousDisplay = formatCompactUsdDisplay(
    payload.previous_volume_usd,
    payload.previous_volume_usd_display,
  );
  const currentDisplay = formatCompactUsdDisplay(
    payload.current_volume_usd,
    payload.current_volume_usd_display,
  );
  const title = `Trading picked up on ${eventTitle}`;

  if (!deltaDisplay || !previousDisplay || !currentDisplay) {
    const body = readNonEmptyString(data.body);

    if (!body) {
      return undefined;
    }

    return {
      variant: "volume",
      title,
      description: body,
      teamNames: [],
      duration: TOAST_DURATION_MS.volume,
    };
  }

  const deltaNumeric = parseNumeric(payload.delta_usd);
  const signedDelta =
    deltaNumeric !== undefined && deltaNumeric > 0 && !deltaDisplay.startsWith("+")
      ? `+${deltaDisplay}`
      : deltaDisplay;
  const description = `(${previousDisplay} → ${currentDisplay}) ${signedDelta}`;

  return {
    variant: "volume",
    title,
    description,
    descriptionParts: [
      { text: `(${previousDisplay} → ${currentDisplay}) ` },
      { text: signedDelta, accent: true },
    ],
    teamNames: [],
    duration: TOAST_DURATION_MS.volume,
  };
}

function formatLargeOrderToast(
  data: Extract<ProphetNotificationData, { notice_type: "large_order" }>,
): ProphetNotificationToastContent | undefined {
  const payload = data.payload;
  const marketName = readNonEmptyString(data.market_name) ?? "Market";
  const outcome = formatOutcomeLabel(data.outcome);
  const side = readNonEmptyString(payload.side)?.toUpperCase() ?? "—";
  const notionalDisplay =
    formatCompactUsdDisplay(payload.notional_usd, payload.notional_usd_display) ??
    "—";
  const price = readNonEmptyString(payload.price) ?? "—";
  const questionTitle = formatMarketQuestionTitle(marketName);
  const outcomeTone = resolveOutcomeTone(outcome);
  const description = `${side} ${notionalDisplay} @ ${price}`;

  return {
    variant: "large_order",
    title: `${questionTitle} ${outcome}`,
    titleParts: [
      { text: `${questionTitle} ` },
      ...(outcomeTone
        ? [{ text: outcome, outcomeTone }]
        : [{ text: outcome }]),
    ],
    description,
    descriptionParts: [
      { text: `${side} ` },
      { text: notionalDisplay, accent: true },
      { text: ` @ ${price}` },
    ],
    teamNames: resolveTeamNamesForMarket(marketName),
    duration: TOAST_DURATION_MS.large_order,
  };
}

export function formatProphetNotificationToast(
  data: ProphetNotificationData,
): ProphetNotificationToastContent | undefined {
  switch (data.notice_type) {
    case "match_preview":
      return formatMatchPreviewToast(data);
    case "price":
      return formatPriceToast(data);
    case "volume":
      return formatVolumeToast(data);
    case "large_order":
      return formatLargeOrderToast(data);
    default:
      return undefined;
  }
}

export function getProphetNotificationToastDuration(
  variant: ProphetToastNoticeType,
): number {
  return TOAST_DURATION_MS[variant];
}
