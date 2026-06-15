"use client";

import type { ReactNode } from "react";
import { Zap } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyLinkIcon } from "@/components/icons";
import { FastBidButton } from "@/components/trading/fast-bid-button";
import { trackCopyLinkClicked } from "@/lib/analytics/tracking";
import { OrderbookToggle } from "@/components/ui/orderbook-toggle";
import { TeamFlag } from "@/components/teams/team-flag";
import { PageBack } from "@/components/ui/page-back";
import { isTeamFastBidReady } from "@/lib/trading/run-fast-bid";
import {
  DEFAULT_FAST_BID_AMOUNT,
  useConfigHydrated,
  useFastBidAmount
} from "@/store";
import type {
  ApiFootballTeamProfile,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "@/types/market";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { BookmarkControl } from "@/views/trade/team/bookmark-control";

export interface TradeHeaderProps {
  snapshot: TeamMarketSnapshot;
  profile?: ApiFootballTeamProfile;
  metadata?: TeamFootballMetadata;
  showOrderbook: boolean;
  onOrderbookChange: (value: boolean) => void;
}

const fastBidButtonClassName =
  "inline-flex h-[36px] min-w-[96px] items-center justify-center gap-1 rounded-lg bg-[#18110F] px-2 text-[14px] font-[500] leading-[17px] text-white disabled:cursor-wait disabled:opacity-70";

function TeamLogo({
  code,
  name,
  logoUrl
}: {
  code?: string;
  name: string;
  logoUrl?: string;
}) {
  return (
    <TeamFlag
      code={code}
      name={name}
      logoUrl={logoUrl}
      className="h-[40px] w-[40px] shrink-0 rounded-[6px] text-[40px]"
    />
  );
}

function getPageUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.href;
}

function HeaderActionButtons({ bookmark }: { bookmark: ReactNode }) {
  const t = useTranslations("trade");

  return (
    <div className="flex items-center gap-3">
      {bookmark}

      <CopyButton
        text={getPageUrl}
        ariaLabel={t("copyPageLink")}
        className="inline-flex size-11 items-center justify-center rounded-sm text-[#909090] transition-colors hover:text-black"
        onCopy={() =>
          trackCopyLinkClicked({
            target: "page_link",
            label: "Copy page link",
            entrySource: "trade_team_page"
          })
        }
      >
        <CopyLinkIcon className="size-4 md:size-5" />
      </CopyButton>
    </div>
  );
}

function TeamIdentityBlock({
  team,
  teamDisplayName,
  logoUrl,
  fifaRank
}: {
  team: TeamMarketSnapshot["team"];
  teamDisplayName: string;
  logoUrl?: string;
  fifaRank?: number;
}) {
  const t = useTranslations("trade");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <TeamLogo code={team.code} name={teamDisplayName} logoUrl={logoUrl} />

      <div className="min-w-0 flex-1 pb-0.5">
        <h1 className="m-0 truncate text-[20px] md:text-[36px] font-[500] capitalize leading-[24px] md:leading-[43px] text-black">
          {teamDisplayName}
        </h1>
        <p className="m-0 mt-0.5 text-right text-[12px] md:text-sm font-[500] text-[#909090] sm:text-left">
          {fifaRank ? (
            <span className="text-prophet-green">
              {t("currentFifaRank", { rank: fifaRank })}
            </span>
          ) : (
            t("rankingPending")
          )}
        </p>
      </div>
    </div>
  );
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
    <div className="hidden flex-col items-end gap-3 md:flex sm:pt-0">
      <HeaderActionButtons bookmark={bookmark} />

      <OrderbookToggle
        variant="team"
        checked={showOrderbook}
        onChange={onOrderbookChange}
      />
    </div>
  );
}

function MobileFastBidButton({ snapshot }: { snapshot: TeamMarketSnapshot }) {
  const t = useTranslations("trade");
  const fastBidAmount = useFastBidAmount();
  const hasHydrated = useConfigHydrated();
  const displayAmount = hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT;
  const fastBidReady = useMemo(
    () => isTeamFastBidReady(snapshot, displayAmount),
    [snapshot, displayAmount]
  );

  return (
    <FastBidButton
      snapshot={snapshot}
      disabled={!fastBidReady}
      className={fastBidButtonClassName}
    >
      <>
        <Zap
          className="h-3.5 w-2.5 shrink-0 fill-white stroke-white"
          aria-hidden="true"
        />
        {t("bid")}
      </>
    </FastBidButton>
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
  const teamDisplayName = useLocalizedTeamName(team.code, team.name);
  const fifaRank = metadata?.fifaRank ?? team.fifaRank;
  const bookmark = (
    <BookmarkControl
      slug={market.polymarket?.slug || ""}
      teamName={teamDisplayName}
    />
  );

  return (
    <header className="md:my-4">
      <div className="flex flex-col md:gap-3 md:hidden">
        <div className="flex items-center justify-between">
          <PageBack />
          <HeaderActionButtons bookmark={bookmark} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <TeamIdentityBlock
            team={team}
            teamDisplayName={teamDisplayName}
            logoUrl={profile?.logoUrl ?? team.logoUrl}
            fifaRank={fifaRank}
          />
          <MobileFastBidButton snapshot={snapshot} />
        </div>
      </div>

      <div className="hidden items-center justify-between md:flex">
        <div className="min-w-0">
          <PageBack />

          <TeamIdentityBlock
            team={team}
            teamDisplayName={teamDisplayName}
            logoUrl={profile?.logoUrl ?? team.logoUrl}
            fifaRank={fifaRank}
          />
        </div>

        <HeaderControls
          showOrderbook={showOrderbook}
          onOrderbookChange={onOrderbookChange}
          bookmark={bookmark}
        />
      </div>
    </header>
  );
}
