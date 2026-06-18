import type {
  ComboPositionRecord,
  PortfolioComboPositionCard
} from "@/lib/portfolio/combo-positions/types";

import { resolveComboLegSelectionLabel } from "./resolve-combo-leg-selection-label";

const ACTIVE_COMBO_STATUSES = new Set(["OPEN", "PARTIAL"]);

function parseDecimal(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isActiveComboPosition(record: ComboPositionRecord): boolean {
  if (!record.status || !ACTIVE_COMBO_STATUSES.has(record.status)) {
    return false;
  }

  return parseDecimal(record.shares_balance) > 0;
}

export function mapComboPositionToCard(
  record: ComboPositionRecord
): PortfolioComboPositionCard | null {
  const legs = record.legs ?? [];

  if (legs.length === 0) {
    return null;
  }

  const stakeAmount = parseDecimal(record.entry_cost_usdc);
  const sharesBalance = parseDecimal(record.shares_balance);
  const entryAvgPrice = parseDecimal(record.entry_avg_price_usdc);
  const multiplier = entryAvgPrice > 0 ? 1 / entryAvgPrice : 0;

  if (stakeAmount <= 0 && sharesBalance <= 0) {
    return null;
  }

  const id =
    record.combo_position_id ??
    record.combo_condition_id ??
    legs[0]?.leg_position_id;

  if (!id) {
    return null;
  }

  return {
    id,
    multiplier,
    stakeAmount,
    toWinAmount: sharesBalance,
    sharesBalance,
    legPositionIds: legs
      .map((leg) => leg.leg_position_id)
      .filter((value): value is string => Boolean(value?.trim())),
    yesPositionId: record.combo_position_id,
    firstEntryAt: record.first_entry_at,
    picks: legs.map((leg, index) => {
      const marketTitle =
        leg.market?.title?.trim() ||
        leg.market?.event?.event_title?.trim() ||
        "";
      const selectionLabel = resolveComboLegSelectionLabel(leg);
      const matchupLabel =
        leg.market?.event?.event_title?.trim() ||
        marketTitle ||
        selectionLabel;
      const teamCode = leg.market?.title?.trim() || selectionLabel;

      return {
        id:
          leg.leg_position_id ??
          `${id}-${leg.leg_index ?? index}`,
        matchupLabel,
        selectionLabel,
        marketTitle,
        legStatus: leg.leg_status,
        legPrice: parseDecimal(leg.leg_current_price) || undefined,
        team: {
          name: selectionLabel,
          code: teamCode,
          logoUrl: leg.market?.icon_url ?? leg.market?.image_url
        }
      };
    })
  };
}

export function mapComboPositionsToCards(
  records: ComboPositionRecord[]
): PortfolioComboPositionCard[] {
  return records
    .filter(isActiveComboPosition)
    .map(mapComboPositionToCard)
    .filter((card): card is PortfolioComboPositionCard => card !== null);
}
