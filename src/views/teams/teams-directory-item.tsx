"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useState } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { formatProbability } from "@/components/home/market-formatters";
import { teamDetailHref } from "@/lib/routes/team";
import { teamTradeHref } from "@/lib/routes/trade";
import { cn } from "@/lib/cn";
import type {
  ApiFootballFixtureContext,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "@/types/market";
import { MarketBidDialog } from "@/views/markets/market-bid-dialog";
import {
  teamsBidButtonClass,
  teamsDetailButtonClass,
  teamsDirectoryGridClass,
  teamsDirectoryRowClass,
  teamsMetricLabelClass
} from "@/views/teams/teams-ui";

export interface TeamsDirectoryItemProps {
  snapshot: TeamMarketSnapshot;
  metadata?: TeamFootballMetadata;
  recentMatches: ApiFootballFixtureContext[];
}

export function TeamsDirectoryItem({
  snapshot,
  metadata,
  recentMatches
}: TeamsDirectoryItemProps) {
  const [bidOpen, setBidOpen] = useState(false);
  const { team, market } = snapshot;
  const isDown = market.change24h < 0;

  return (
    <article className={teamsDirectoryRowClass}>
      <div className={teamsDirectoryGridClass}>
        <Link
          href={teamDetailHref(team.id)}
          className="flex min-w-0 items-center gap-3"
        >
          <TeamFlag
            code={team.code}
            name={team.name}
            className="h-8 w-8 shrink-0 rounded-[2px] text-[32px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <div className="min-w-0">
            <h3 className="m-0 text-lg font-[556] leading-[21px] text-black">
              {team.name}
            </h3>
            <p className={cn("m-0 mt-0.5", teamsMetricLabelClass)}>
              {team.region}
            </p>
          </div>
        </Link>

        <DirectoryMetric
          label="FIFA rank"
          value={rankValueLabel(metadata, snapshot)}
          secondaryLabel="Squad value"
          secondaryValue={formatSquadValue(metadata)}
        />

        <div className="flex flex-col gap-1">
          <FormStrip matches={recentMatches} />
          <span className={teamsMetricLabelClass}>Form</span>
        </div>

        <DirectoryMetric label="Group" value={formatGroup(metadata)} />

        <div className="flex flex-col gap-0.5">
          <strong className="text-sm font-[556] leading-[17px] text-black">
            {metadata?.keyPlayers[0]?.name ?? "Pending"}
          </strong>
          <span className={teamsMetricLabelClass}>Key player</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <strong className="text-lg font-[556] leading-[21px] text-black">
            {formatProbability(market.bookmakerImpliedProbability)}
          </strong>
          <span
            className={cn(
              teamsMetricLabelClass,
              isDown ? "text-prophet-red" : "text-[#65AF14]"
            )}
          >
            Market {formatProbability(market.probability)} · {market.change24h}
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 xl:justify-end"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className={teamsBidButtonClass}
            aria-label={`Bid on ${team.name}`}
            onClick={() => setBidOpen(true)}
          >
            <Zap
              className="h-3.5 w-2.5 shrink-0 fill-white stroke-white"
              aria-hidden="true"
            />
            Bid
          </button>
          <Link
            className={teamsDetailButtonClass}
            href={teamDetailHref(team.id)}
          >
            Details
          </Link>
          <Link
            className={teamsDetailButtonClass}
            href={teamTradeHref(team.id)}
          >
            Trade
          </Link>
        </div>
      </div>

      <MarketBidDialog
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        snapshot={snapshot}
      />
    </article>
  );
}

function DirectoryMetric({
  label,
  value,
  secondaryLabel,
  secondaryValue
}: {
  label: string;
  value: string;
  secondaryLabel?: string;
  secondaryValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <strong className="text-sm font-[556] leading-[17px] text-black">
          {value}
        </strong>
        <span className={teamsMetricLabelClass}>{label}</span>
      </div>
      {secondaryLabel && secondaryValue ? (
        <div className="flex flex-col gap-0.5">
          <strong className="text-sm font-[556] leading-[17px] text-black">
            {secondaryValue}
          </strong>
          <span className={teamsMetricLabelClass}>{secondaryLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

function FormStrip({ matches }: { matches: ApiFootballFixtureContext[] }) {
  if (matches.length === 0) {
    return (
      <strong className="text-sm font-[556] text-prophet-muted">
        No official data
      </strong>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-1.5"
      aria-label="Last five match results"
    >
      {matches.slice(0, 5).map((match) => (
        <span
          key={match.fixtureId}
          className={
            match.result === "W"
              ? "inline-flex size-7 items-center justify-center rounded-md bg-[#f1fdf8] text-xs font-[556] text-prophet-green"
              : match.result === "L"
                ? "inline-flex size-7 items-center justify-center rounded-md bg-[#fff4f6] text-xs font-[556] text-prophet-red"
                : "inline-flex size-7 items-center justify-center rounded-md bg-[#fafbfc] text-xs font-[556] text-prophet-muted"
          }
        >
          {match.result ?? "-"}
        </span>
      ))}
    </div>
  );
}

function rankValueLabel(
  metadata: TeamFootballMetadata | undefined,
  snapshot: TeamMarketSnapshot
): string {
  const rank = metadata?.fifaRank ?? snapshot.team.fifaRank;
  return rank ? `#${rank}` : "Pending";
}

function formatSquadValue(metadata: TeamFootballMetadata | undefined): string {
  if (!metadata?.squadValue) {
    return "Pending";
  }

  const value = metadata.squadValue;
  const currency = metadata.squadValueCurrency === "USD" ? "$" : "€";

  if (value >= 1_000_000_000) {
    return `${currency}${(value / 1_000_000_000).toFixed(2)}B`;
  }

  return `${currency}${Math.round(value / 1_000_000)}M`;
}

function formatGroup(metadata: TeamFootballMetadata | undefined): string {
  if (!metadata?.group || metadata.group === "Pending") {
    return "Pending";
  }

  return `Group ${metadata.group}`;
}
