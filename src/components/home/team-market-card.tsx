import Link from "next/link";

import { teamTradeHref } from "../../lib/routes/trade";

import type { TeamMarketSnapshot } from "../../types/market";
import {
  formatChange,
  formatProbability,
  formatVolume,
  getChangeTone,
  getSentimentLabel,
} from "./market-formatters";

interface TeamMarketCardProps {
  snapshot: TeamMarketSnapshot;
}

export function TeamMarketCard({ snapshot }: TeamMarketCardProps) {
  const { team, market } = snapshot;
  const isPositive = market.change24h >= 0;

  return (
    <Link
      href={teamTradeHref(team.id)}
      aria-label={`Open ${team.name} trade`}
      className="block rounded-lg border border-terminal-line/80 bg-terminal-panel/88 p-5 shadow-terminal transition duration-200 hover:-translate-y-0.5 hover:border-terminal-orange/55 hover:shadow-heat"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="terminal-label text-[10px] uppercase tracking-[0.28em] text-terminal-muted">{team.code}</p>
          <h3 className="mt-2 text-lg font-semibold text-terminal-text">{team.name}</h3>
          <p className="mt-1 text-xs text-terminal-muted">
            {team.code} / {team.region}
          </p>
        </div>
        <span
          className={
            isPositive
              ? "rounded border border-terminal-green/40 bg-terminal-green/10 px-2.5 py-1 text-xs text-terminal-green"
              : "rounded border border-terminal-red/40 bg-terminal-red/10 px-2.5 py-1 text-xs text-terminal-red"
          }
        >
          {formatChange(market.change24h)}
        </span>
      </div>

      <div className="mt-6">
        <p className="terminal-label text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Current probability</p>
        <p className="mt-1 font-display text-5xl font-semibold leading-none text-terminal-bone">
          {formatProbability(market.probability)}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-terminal-line/70 pt-4">
        <Metric
          label="7d"
          value={formatChange(market.change7d)}
          valueClassName={getChangeTone(market.change7d)}
        />
        <Metric label="Volume" value={formatVolume(market.volume)} />
          <Metric label="Sentiment" value={getSentimentLabel(market.sentiment)} />
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
  valueClassName = "text-terminal-text",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="terminal-label text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}
