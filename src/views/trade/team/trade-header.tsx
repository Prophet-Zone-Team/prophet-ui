"use client";

import type { ReactNode } from "react";

import { CopyLinkIcon } from "@/components/icons";
import { OrderbookToggle } from "@/components/ui/orderbook-toggle";
import { TeamFlag } from "@/components/teams/team-flag";
import { PageBack } from "@/components/ui/page-back";
import type {
  ApiFootballTeamProfile,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "@/types/market";
import { BookmarkControl } from "@/views/trade/team/bookmark-control";

export interface TradeHeaderProps {
  snapshot: TeamMarketSnapshot;
  profile?: ApiFootballTeamProfile;
  metadata?: TeamFootballMetadata;
  showOrderbook: boolean;
  onOrderbookChange: (value: boolean) => void;
}

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
}: {
  showOrderbook: boolean;
  onOrderbookChange: (value: boolean) => void;
  bookmark: ReactNode;
}) {
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

      <OrderbookToggle
        variant="team"
        checked={showOrderbook}
        onChange={onOrderbookChange}
      />
    </div>
  );
}

export function TradeHeader({
  snapshot,
  profile,
  metadata,
  showOrderbook,
  onOrderbookChange
}: TradeHeaderProps) {
  const { team, market } = snapshot;
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
          bookmark={
            <BookmarkControl
              slug={market.polymarket?.slug || ""}
              teamName={team.name}
            />
          }
        />
      </div>
    </header>
  );
}
