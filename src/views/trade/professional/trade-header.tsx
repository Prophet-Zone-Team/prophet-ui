"use client";

import type { ReactNode } from "react";

import { CopyLinkIcon } from "@/components/icons";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type {
  ApiFootballTeamProfile,
  TeamFootballMetadata,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { MatchBookmarkControl } from "@/views/home/matches/match-bookmark-control";
import { BookmarkControl } from "@/views/trade/professional/bookmark-control";
import { PageBack } from "@/components/ui/page-back";

type TradeHeaderBaseProps = {
  showOrderbook: boolean;
  onOrderbookChange: (value: boolean) => void;
};

type TradeHeaderControlsProps = TradeHeaderBaseProps & {
  bookmark: ReactNode;
};

export type TradeHeaderTeamProps = TradeHeaderBaseProps & {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
  profile?: ApiFootballTeamProfile;
  metadata?: TeamFootballMetadata;
};

export type TradeHeaderGameProps = TradeHeaderBaseProps & {
  variant: "game";
  match: WorldCupMatch;
  teamSnapshots: TeamMarketSnapshot[];
  teamProfiles?: Partial<Record<string, ApiFootballTeamProfile>>;
};

export type TradeHeaderProps = TradeHeaderTeamProps | TradeHeaderGameProps;

function TeamLogo({
  code,
  name,
  logoUrl
}: {
  code?: string;
  name: string;
  logoUrl?: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-[40px] w-[40px] shrink-0 rounded-lg object-contain shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
    );
  }

  return (
    <TeamFlag
      code={code}
      name={name}
      className="h-[68px] w-[68px] shrink-0 rounded-lg text-[56px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
    />
  );
}

async function copyPageLink() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
  } catch {
    // Clipboard unavailable
  }
}

function HeaderControls({
  showOrderbook,
  onOrderbookChange,
  bookmark
}: TradeHeaderControlsProps) {
  return (
    <div className="flex flex-col items-end gap-3 sm:pt-0">
      <div className="flex items-center gap-3">
        {bookmark}

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-sm text-[#909090] transition-colors hover:text-black"
          aria-label="Copy page link"
          onClick={() => void copyPageLink()}
        >
          <CopyLinkIcon />
        </button>
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={showOrderbook}
          aria-label="Show orderbook"
          onClick={() => onOrderbookChange(!showOrderbook)}
          className={cn(
            "relative h-4 w-[29px] shrink-0 rounded-lg border border-[#EAEAEA] transition-colors",
            showOrderbook ? "bg-[#F4B600]" : "bg-[#EBEBEB]"
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 size-3 -translate-y-1/2 rounded-lg border border-[#EAEAEA] bg-white transition-[left]",
              showOrderbook ? "left-[calc(100%-14px)]" : "left-0.5"
            )}
            aria-hidden
          />
        </button>
        <span className="whitespace-nowrap text-base font-[457] leading-[19px] text-[#909090]">
          Orderbook
        </span>
      </label>
    </div>
  );
}

function TradeTeamHeader({
  snapshot,
  profile,
  metadata,
  showOrderbook,
  onOrderbookChange
}: TradeHeaderTeamProps) {
  const { team } = snapshot;
  const fifaRank = metadata?.fifaRank ?? team.fifaRank;

  return (
    <header className="my-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <PageBack />

          <div className="flex min-w-0 items-center gap-3">
            <TeamLogo
              code={team.code}
              name={team.name}
              logoUrl={profile?.logoUrl}
            />

            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex items-center gap-4">
                <h1 className="m-0 truncate text-[36px] font-[556] capitalize leading-[43px] text-black">
                  {team.name}
                </h1>
              </div>
              <p className="m-0 mt-0.5 text-right text-sm font-[556] leading-[17px] text-[#909090] sm:text-left">
                {fifaRank ? (
                  <>
                    Current{" "}
                    <span className="text-prophet-green">No.{fifaRank}</span>
                  </>
                ) : (
                  "Ranking pending"
                )}
              </p>
            </div>
          </div>
        </div>

        <HeaderControls
          showOrderbook={showOrderbook}
          onOrderbookChange={onOrderbookChange}
          bookmark={<BookmarkControl teamId={team.id} teamName={team.name} />}
        />
      </div>
    </header>
  );
}

function TradeGameHeader({
  match,
  teamSnapshots,
  teamProfiles,
  showOrderbook,
  onOrderbookChange
}: TradeHeaderGameProps) {
  const sides = resolveMatchSides(match, teamSnapshots);
  const homeProfile = match.homeTeamId
    ? teamProfiles?.[match.homeTeamId]
    : undefined;
  const awayProfile = match.awayTeamId
    ? teamProfiles?.[match.awayTeamId]
    : undefined;

  return (
    <header className="my-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <PageBack />

          <div className="flex min-w-0 items-center gap-6 m-0 truncate text-[36px] font-[556] capitalize leading-[43px] text-black">
            <div className="flex shrink-0 items-center gap-2">
              <TeamLogo
                code={sides.home.code}
                name={sides.home.name ?? "Home"}
                logoUrl={homeProfile?.logoUrl}
              />
              <span>{sides.home.name}</span>
            </div>
            <span className="text-[30px]">vs</span>
            <div className="flex shrink-0 items-center gap-2">
              <TeamLogo
                code={sides.away.code}
                name={sides.away.name ?? "Away"}
                logoUrl={awayProfile?.logoUrl}
              />
              <span>{sides.away.name}</span>
            </div>
          </div>
        </div>

        <HeaderControls
          showOrderbook={showOrderbook}
          onOrderbookChange={onOrderbookChange}
          bookmark={<MatchBookmarkControl matchId={match.id} />}
        />
      </div>
    </header>
  );
}

export function TradeHeader(props: TradeHeaderProps) {
  if (props.variant === "game") {
    return <TradeGameHeader {...props} />;
  }

  return <TradeTeamHeader {...props} />;
}
