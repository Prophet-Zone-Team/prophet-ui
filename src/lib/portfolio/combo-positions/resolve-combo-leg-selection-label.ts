import type { ComboPositionLeg } from "@/lib/portfolio/combo-positions/types";

const SPREAD_TITLE_PATTERN = /(.+?)\s*([+-])\s*(\d+(?:\.\d+)?)/;
const TOTAL_TITLE_PATTERN =
  /^(?:o\s*\/\s*u\s*\d+(?:\.\d+)?|(?:over|under)\s*\d+(?:\.\d+)?)/i;
const BINARY_OUTCOME_PATTERN = /^(yes|no)$/i;

function isSpreadTitle(title: string): boolean {
  return SPREAD_TITLE_PATTERN.test(title.trim());
}

function isDrawLeg(title: string, slug: string): boolean {
  if (/draw/i.test(title)) {
    return true;
  }

  return slug.includes("-draw");
}

function isTotalTitle(title: string): boolean {
  return TOTAL_TITLE_PATTERN.test(title.trim());
}

function isBinaryOutcome(value: string): boolean {
  return BINARY_OUTCOME_PATTERN.test(value.trim());
}

export function resolveComboLegSelectionLabel(leg: ComboPositionLeg): string {
  const title = leg.market?.title?.trim() ?? "";
  const slug = leg.market?.slug?.trim() ?? "";
  const eventTitle = leg.market?.event?.event_title?.trim() ?? "";
  const outcome =
    leg.leg_outcome_label?.trim() || leg.market?.outcome?.trim() || "";

  if (title && isSpreadTitle(title)) {
    return title;
  }

  if (isDrawLeg(title, slug)) {
    return "Draw";
  }

  if (title && isTotalTitle(title)) {
    return title;
  }

  if (title && !isBinaryOutcome(title) && isBinaryOutcome(outcome)) {
    return title;
  }

  if (title) {
    return title;
  }

  if (eventTitle) {
    return eventTitle;
  }

  if (outcome) {
    return outcome;
  }

  return "Outcome";
}
