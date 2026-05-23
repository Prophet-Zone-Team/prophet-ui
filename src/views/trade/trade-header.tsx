"use client";

import Link from "next/link";

import { BackChevronIcon, CopyLinkIcon } from "@/components/icons";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type {
  ApiFootballTeamProfile,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "@/types/market";
import { BookmarkControl } from "@/views/trade/bookmark-control";

export interface TradeHeaderProps {
  snapshot: TeamMarketSnapshot;
  profile?: ApiFootballTeamProfile;
  metadata?: TeamFootballMetadata;
  showOrderbook: boolean;
  onOrderbookChange: (value: boolean) => void;
}

export function TradeHeader({
  snapshot,
  profile,
  metadata,
  showOrderbook,
  onOrderbookChange
}: TradeHeaderProps) {
  const { team } = snapshot;
  const fifaRank = metadata?.fifaRank ?? team.fifaRank;

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

  return (
    <header className="my-4">
      <div className="flex justify-between items-center">
        <div className="min-w-0">
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-[556] leading-[17px] text-black hover:opacity-80"
          >
            <BackChevronIcon />
            back
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            {profile?.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt=""
                className="h-[68px] w-[68px] shrink-0 rounded-lg object-contain shadow-[0_0_2px_rgba(0,0,0,0.2)]"
              />
            ) : (
              <TeamFlag
                code={team.code}
                name={team.name}
                className="h-[68px] w-[68px] shrink-0 rounded-lg text-[56px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
              />
            )}

            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex items-center gap-4">
                <h1 className="m-0 truncate text-[36px] font-[556] capitalize leading-[43px] text-black">
                  {team.name}
                </h1>
                <span
                  role="status"
                  className="inline-flex h-[26px] min-w-[79px] items-center justify-center rounded-[14px] border border-[#909090] px-3 text-sm font-[556] leading-[17px] text-[#909090]"
                >
                  Trade
                </span>
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

        <div className="flex flex-col items-end gap-3 sm:pt-0">
          <div className="flex items-center gap-3">
            <BookmarkControl teamId={team.id} teamName={team.name} />

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
      </div>
    </header>
  );
}
