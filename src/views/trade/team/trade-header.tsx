"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyLinkIcon } from "@/components/icons";
import { trackCopyLinkClicked } from "@/lib/analytics/tracking";
import { OrderbookToggle } from "@/components/ui/orderbook-toggle";
import { TeamFlag } from "@/components/teams/team-flag";
import { PageBack } from "@/components/ui/page-back";
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
      className="h-[40px] w-[40px] shrink-0 rounded-lg text-[32px]"
    />
  );
}

function getPageUrl() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.href;
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
  const t = useTranslations("trade");

  return (
    <div className="flex flex-col items-end gap-3 sm:pt-0">
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
          <CopyLinkIcon />
        </CopyButton>
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
  const t = useTranslations("trade");
  const { team, market } = snapshot;
  const teamDisplayName = useLocalizedTeamName(team.code, team.name);
  const fifaRank = metadata?.fifaRank ?? team.fifaRank;
  return (
    <header className="my-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <PageBack />

          <div className="flex min-w-0 items-center gap-3">
            <TeamLogo
              code={team.code}
              name={teamDisplayName}
              logoUrl={profile?.logoUrl ?? team.logoUrl}
            />

            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex items-center gap-4">
                <h1 className="m-0 truncate text-[36px] font-[500] capitalize leading-[43px] text-black">
                  {teamDisplayName}
                </h1>
              </div>
              <p className="m-0 mt-0.5 text-right text-sm font-[500] leading-[17px] text-[#909090] sm:text-left">
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
        </div>

        <HeaderControls
          showOrderbook={showOrderbook}
          onOrderbookChange={onOrderbookChange}
          bookmark={
            <BookmarkControl
              slug={market.polymarket?.slug || ""}
              teamName={teamDisplayName}
            />
          }
        />
      </div>
    </header>
  );
}
