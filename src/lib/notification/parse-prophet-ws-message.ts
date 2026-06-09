import { PROPHET_NOTICE_TYPES } from "@/types/prophet-notification-ws";
import type {
  ProphetNotificationData,
  ProphetNoticeType,
  ProphetWsNotificationMessage,
} from "@/types/prophet-notification-ws";

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function isNoticeType(value: unknown): value is ProphetNoticeType {
  return (
    typeof value === "string" &&
    (PROPHET_NOTICE_TYPES as readonly string[]).includes(value)
  );
}

export function parseProphetWsNotificationMessage(
  raw: unknown,
): ProphetWsNotificationMessage | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const record = raw as Record<string, unknown>;

  if (record.type !== "notification") {
    return undefined;
  }

  const data = record.data;

  if (!data || typeof data !== "object") {
    return undefined;
  }

  const dataRecord = data as Record<string, unknown>;
  const noticeType = dataRecord.notice_type;

  if (!isNoticeType(noticeType)) {
    return undefined;
  }

  const payload =
    dataRecord.payload && typeof dataRecord.payload === "object"
      ? (dataRecord.payload as Record<string, unknown>)
      : {};

  const base = {
    source: readNonEmptyString(dataRecord.source),
    notice_type: noticeType,
    event_slug: readNonEmptyString(dataRecord.event_slug),
    event_title: readNonEmptyString(dataRecord.event_title),
    market_id: readNonEmptyString(dataRecord.market_id),
    market_name: readNonEmptyString(dataRecord.market_name),
    outcome: readNonEmptyString(dataRecord.outcome),
    title: readNonEmptyString(dataRecord.title),
    body: readNonEmptyString(dataRecord.body),
    timestamp:
      typeof dataRecord.timestamp === "number"
        ? dataRecord.timestamp
        : undefined,
    payload,
  };

  return {
    type: "notification",
    data: base as ProphetNotificationData,
  };
}
