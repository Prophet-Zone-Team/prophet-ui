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
    <article className="rounded-lg border border-terminal-line/80 bg-terminal-panel/88 p-5 shadow-terminal transition duration-200 hover:border-terminal-cyan/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-terminal-muted">{team.code}</p>
          <h3 className="mt-2 text-lg font-semibold text-terminal-text">{team.name}</h3>
          <p className="mt-1 text-xs text-terminal-muted">
            {team.code} / Group {team.group}
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
        <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">Current probability</p>
        <p className="mt-1 text-4xl font-semibold leading-none text-terminal-text">
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
    </article>
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
      <p className="text-[10px] uppercase tracking-[0.18em] text-terminal-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}
