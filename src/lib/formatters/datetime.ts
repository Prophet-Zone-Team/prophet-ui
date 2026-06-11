const DATE_PARTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

const TIME_PARTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const DATETIME_PARTS: Intl.DateTimeFormatOptions = {
  ...DATE_PARTS,
  ...TIME_PARTS,
  second: "2-digit",
};

function lookupPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((part) => part.type === type)?.value ?? "00";
}

function createFormatter(
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    ...(timeZone ? { timeZone } : {}),
  });
}

function formatDateFromParts(parts: Intl.DateTimeFormatPart[]): string {
  return `${lookupPart(parts, "year")}-${lookupPart(parts, "month")}-${lookupPart(parts, "day")}`;
}

function formatTimeFromParts(parts: Intl.DateTimeFormatPart[]): string {
  return `${lookupPart(parts, "hour")}:${lookupPart(parts, "minute")}`;
}

function formatDateTimeFromParts(parts: Intl.DateTimeFormatPart[]): string {
  return `${formatDateFromParts(parts)} ${formatTimeFromParts(parts)}:${lookupPart(parts, "second")}`;
}

export function formatDate(date: Date, timeZone?: string): string {
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatDateFromParts(
    createFormatter(DATE_PARTS, timeZone).formatToParts(date),
  );
}

export function formatDateFromIso(
  value: string | undefined,
  timeZone?: string,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDate(date, timeZone);
}

export function formatDateFromUnixSeconds(
  value: number,
  timeZone?: string,
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return formatDate(new Date(value * 1000), timeZone);
}

export function formatTime(date: Date, timeZone?: string): string {
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatTimeFromParts(
    createFormatter(TIME_PARTS, timeZone).formatToParts(date),
  );
}

export function formatTimeFromIso(
  value: string | undefined,
  timeZone?: string,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatTime(date, timeZone);
}

export function formatTimeFromUnixSeconds(
  value: number,
  timeZone?: string,
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return formatTime(new Date(value * 1000), timeZone);
}

export function formatDateTime(date: Date, timeZone?: string): string {
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatDateTimeFromParts(
    createFormatter(DATETIME_PARTS, timeZone).formatToParts(date),
  );
}

export function formatDateTimeFromIso(
  value: string | undefined,
  timeZone?: string,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime(date, timeZone);
}

export function formatDateTimeFromUnixSeconds(
  value: number,
  timeZone?: string,
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return formatDateTime(new Date(value * 1000), timeZone);
}
