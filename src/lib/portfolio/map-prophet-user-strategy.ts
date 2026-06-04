import {
  findCuratedEntryByName,
  findCuratedEntryBySlug,
  type CuratedTeamEntry
} from "@/data/teams/curated-team-list";
import { parseGammaArrayField } from "@/lib/market/polymarket-gamma";
import {
  getPortfolioStrategyStatusDisplay,
  resolveStrategyTeamTournamentState
} from "@/lib/strategy/portfolio-strategy-status";
import type {
  ProphetStrategyTeamItem,
  ProphetStrategyView
} from "@/types/prophet-api";
import { mapCuratedTeamToRef } from "@/views/strategy/lib/map-strategy-data";
import type {
  PortfolioStrategyLeg,
  PortfolioStrategyRecord
} from "@/views/portfolio/strategy/types";

function parseDecimal(value: string | undefined): number {
  const parsed = Number(value?.trim());

  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseStrategyCurrPrice(raw?: string): number {
  const fromArray = parseGammaArrayField(raw)
    .map((item) => Number(item))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (fromArray.length > 0) {
    return fromArray[0];
  }

  return parseDecimal(raw);
}

function parseCreatedAt(value: string | undefined): string {
  if (!value?.trim()) {
    return new Date(0).toISOString();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

function syntheticCuratedEntry(name: string): CuratedTeamEntry {
  const trimmed = name.trim() || "—";

  return {
    name: trimmed,
    logo: "",
    abbreviation: trimmed.slice(0, 3).toUpperCase(),
    continent: "",
    started: false,
    eliminated: false
  };
}

export function findCuratedEntryForStrategyTeam(
  item: ProphetStrategyTeamItem
): CuratedTeamEntry | undefined {
  const name = item.name?.trim() ?? "";
  const byName = name ? findCuratedEntryByName(name) : undefined;

  if (byName) {
    return byName;
  }

  const slug = item.slug?.trim();

  return slug ? findCuratedEntryBySlug(slug) : undefined;
}

export function resolveStrategyCuratedTeams(
  teams: ProphetStrategyTeamItem[] | undefined
): CuratedTeamEntry[] {
  return (teams ?? []).map((item) => {
    const name = item.name?.trim() ?? "";

    return (
      findCuratedEntryForStrategyTeam(item) ?? syntheticCuratedEntry(name)
    );
  });
}

export function resolveStrategyTeamStates(
  teams: ProphetStrategyTeamItem[] | undefined
) {
  return (teams ?? []).map((item) =>
    resolveStrategyTeamTournamentState(
      item,
      findCuratedEntryForStrategyTeam(item)
    )
  );
}

function resolveLegMarketTitle(item: ProphetStrategyTeamItem): string {
  return item.name?.trim() || item.slug?.trim() || "—";
}

function resolveLegToWinAmount(
  item: ProphetStrategyTeamItem,
  tradedAmount: number,
  entryPrice: number
): number {
  const apiToWin = parseDecimal(item.to_win);

  if (apiToWin > 0) {
    return apiToWin;
  }

  if (tradedAmount > 0 && entryPrice > 0) {
    return tradedAmount / entryPrice;
  }

  return 0;
}

export function computeLegPositionMetrics(item: ProphetStrategyTeamItem): {
  tradedAmount: number;
  entryPrice: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
} {
  const tradedAmount = parseDecimal(item.amount);
  const entryPrice = parseDecimal(item.price);
  const currentPrice = parseStrategyCurrPrice(item.curr_price);

  if (tradedAmount <= 0 || entryPrice <= 0 || currentPrice <= 0) {
    return {
      tradedAmount,
      entryPrice,
      currentValue: tradedAmount,
      cashPnl: 0,
      percentPnl: 0
    };
  }

  const shares = tradedAmount / entryPrice;
  const currentValue = shares * currentPrice;
  const cashPnl = currentValue - tradedAmount;
  const percentPnl = tradedAmount > 0 ? (cashPnl / tradedAmount) * 100 : 0;

  return { tradedAmount, entryPrice, currentValue, cashPnl, percentPnl };
}

function mapStrategyLeg(
  item: ProphetStrategyTeamItem,
  index: number,
  tradedAt: string
): PortfolioStrategyLeg | null {
  const orderId = item.order_id?.trim();

  if (!orderId) {
    return null;
  }

  const curatedTeam = findCuratedEntryForStrategyTeam(item);
  const { tradedAmount, entryPrice, currentValue, cashPnl, percentPnl } =
    computeLegPositionMetrics(item);

  return {
    id: orderId || `leg-${index}`,
    team: curatedTeam
      ? mapCuratedTeamToRef(curatedTeam)
      : {
          code: (item.name ?? "—").slice(0, 3).toUpperCase(),
          name: item.name?.trim() || "—",
          logoUrl: undefined
        },
    marketTitle: resolveLegMarketTitle(item),
    side: "yes",
    tradedAmount,
    toWinAmount: resolveLegToWinAmount(item, tradedAmount, entryPrice),
    currentValue,
    cashPnl,
    percentPnl,
    tradedAt
  };
}

export function mapProphetUserStrategy(
  strategy: ProphetStrategyView
): PortfolioStrategyRecord | null {
  const id = strategy.id;

  if (id === undefined || id === null) {
    return null;
  }

  const tradedAt = parseCreatedAt(strategy.created_at);
  const legs = (strategy.teams ?? [])
    .map((item, index) => mapStrategyLeg(item, index, tradedAt))
    .filter((leg): leg is PortfolioStrategyLeg => leg !== null);

  const curatedTeams = resolveStrategyCuratedTeams(strategy.teams);
  const teamStates = resolveStrategyTeamStates(strategy.teams);
  const { status, label } = getPortfolioStrategyStatusDisplay(
    teamStates,
    curatedTeams
  );

  return {
    id: String(id),
    name: strategy.name?.trim() || "Strategy",
    status,
    statusLabel: label,
    roiLabel: strategy.roi?.trim() || "—",
    value: parseDecimal(strategy.value),
    hitReturnLabel: strategy.hit_return?.trim() || "—",
    legs
  };
}

export function mapProphetUserStrategies(
  rows: ProphetStrategyView[] | undefined
): PortfolioStrategyRecord[] {
  return (rows ?? [])
    .map((row) => mapProphetUserStrategy(row))
    .filter((record): record is PortfolioStrategyRecord => record !== null);
}
