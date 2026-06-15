"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { KeyboardEvent } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import Popover from "@/components/popover";
import { TeamFlag } from "@/components/teams/team-flag";
import { useAuthOptional } from "@/context/auth";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { formatOrderbookPrice } from "@/lib/market/order-math";
import { teamTradeHref } from "@/lib/routes/trade";
import {
  useSetTradeOutcomeSide,
  useSyncTradeTicketSnapshot,
  useTradeOutcomeSide
} from "@/store";
import type { OrderOutcomeSide, TeamMarketSnapshot } from "@/types/market";
import { useLiveTeamSnapshot } from "@/context/market-live-price-ws";
import { getTeamSimpleSidePrice } from "@/views/trade/game/market-section/format-bid-label";

const TAB_UNDERLINE_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85
};

export interface GroupDetailTeamProps {
  snapshot: TeamMarketSnapshot;
  className?: string;
  selected?: boolean;
  onSelect?: () => void;
  underlineLayoutId: string;
  /** When true, Yes/No stays on the current page instead of navigating to trade. */
  tradeInPlace?: boolean;
  onOutcomeClick?: (side: OrderOutcomeSide) => void;
  points?: number;
}

function formatGroupTeamProbability(value: number): string {
  return `${Math.round(value)}%`;
}

function OutcomeButton({
  side,
  price,
  active,
  disabled,
  onClick
}: {
  side: OrderOutcomeSide;
  price: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("trade");
  const isYes = side === "yes";
  const priceLabel = formatOrderbookPrice(price);
  const label = `${isYes ? t("yes") : t("no")} ${priceLabel}`;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "box-border inline-flex h-10 w-[107px] shrink-0 items-center justify-center rounded-[8px] border",
        "text-[14px] font-[500] leading-[18px] transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-70",
        active
          ? isYes
            ? "border-[#65AF14] bg-[#65AF14] text-white"
            : "border-[#FF674B] bg-[#FF674B] text-white"
          : isYes
            ? "border-[#65AF14] bg-transparent text-[#65AF14] hover:bg-[#fafbfc]"
            : "border-[#FF674B] bg-transparent text-[#FF674B] hover:bg-[#fafbfc]"
      )}
    >
      {label}
    </button>
  );
}

export function GroupDetailTeam({
  snapshot,
  className,
  selected = false,
  onSelect,
  underlineLayoutId,
  tradeInPlace = false,
  onOutcomeClick,
  points
}: GroupDetailTeamProps) {
  const router = useRouter();
  const auth = useAuthOptional();
  const t = useTranslations("trade");
  const syncTeamSnapshot = useSyncTradeTicketSnapshot();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const tradeOutcomeSide = useTradeOutcomeSide();
  const isBuyRestricted = auth?.isBuyRestricted ?? false;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const regionRestricted = isAuthenticated && isBuyRestricted;

  const liveSnapshot = useLiveTeamSnapshot(snapshot);
  const { team, market } = liveSnapshot;
  const displayName = useLocalizedTeamName(team.code, team.name);
  const yesPrice = getTeamSimpleSidePrice(liveSnapshot, "yes");
  const noPrice = getTeamSimpleSidePrice(liveSnapshot, "no");
  const probabilityLabel = formatGroupTeamProbability(market.probability);

  function handleOutcomeClick(side: OrderOutcomeSide) {
    if (regionRestricted) {
      return;
    }

    onSelect?.();
    syncTeamSnapshot(liveSnapshot);
    setOutcomeSide(side);

    if (tradeInPlace) {
      onOutcomeClick?.(side);
      return;
    }

    router.push(teamTradeHref(team.id));
  }

  function handleSelectTeam() {
    onSelect?.();
  }

  function handleSelectKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelectTeam();
    }
  }

  return (
    <>
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        aria-label={displayName}
        tabIndex={selected ? 0 : -1}
        onClick={onSelect}
        className={cn(
          "flex min-w-0 flex-1 cursor-pointer flex-col items-center border-0 bg-transparent p-0 md:hidden",
          "transition-opacity duration-200",
          className
        )}
      >
        <span
          className={cn(
            "text-[20px] leading-[24px] text-black",
            selected ? "font-[600]" : "font-[400]"
          )}
        >
          {probabilityLabel}
        </span>

        <TeamFlag
          code={team.code}
          name={displayName}
          logoUrl={team.logoUrl}
          className="mt-1 h-[40px] w-[40px] shrink-0 rounded-[6px] text-[40px]"
        />

        <span
          className={cn(
            "mt-1 max-w-full truncate px-1 text-[14px] leading-[15px] text-black",
            selected ? "font-[600]" : "font-[400]"
          )}
        >
          {displayName}
        </span>

        {selected ? (
          <motion.span
            layoutId={underlineLayoutId}
            aria-hidden="true"
            className="mt-2 block h-0 w-10 shrink-0 rounded-[6px] border-b-[3px] border-black"
            transition={TAB_UNDERLINE_TRANSITION}
          />
        ) : (
          <span
            aria-hidden="true"
            className="mt-2 block h-0 w-10 shrink-0 border-b-[3px] border-transparent"
          />
        )}
      </button>

      <article
        className={cn(
          "box-border hidden w-[222px] flex-col justify-between rounded-[8px] md:flex",
          className
        )}
        aria-label={displayName}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleSelectTeam}
          onKeyDown={handleSelectKeyDown}
          className="flex cursor-pointer items-end gap-2"
        >
          <TeamFlag
            code={team.code}
            name={displayName}
            logoUrl={team.logoUrl}
            className="h-[50px] w-[49px] shrink-0 rounded-[6px] text-[50px]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 justify-between items-center gap-1.5">
              <div className="truncate text-[16px] font-[500] leading-5 text-black">
                {displayName}
              </div>
              {points != null ? (
                <Popover
                  placement="Top"
                  trigger="Hover"
                  content={
                    <div className="flex h-[46px] w-[118px] items-center justify-center rounded-[12px] border border-[#EBEBEB] bg-white px-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
                      <span className="text-[14px] font-[400] leading-[18px] text-black">
                        {t("currentPoint")}
                      </span>
                    </div>
                  }
                >
                  <span className="shrink-0 text-[16px] font-[500] leading-5 text-black">
                    {points}
                  </span>
                </Popover>
              ) : null}
            </div>
            <div className="shrink-0 text-[24px] font-[500] leading-[30px] text-black">
              {probabilityLabel}
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <RegionRestrictedControl restricted={regionRestricted}>
            <OutcomeButton
              side="yes"
              price={yesPrice}
              active={selected && tradeOutcomeSide === "yes"}
              disabled={regionRestricted}
              onClick={() => handleOutcomeClick("yes")}
            />
          </RegionRestrictedControl>

          <RegionRestrictedControl restricted={regionRestricted}>
            <OutcomeButton
              side="no"
              price={noPrice}
              active={selected && tradeOutcomeSide === "no"}
              disabled={regionRestricted}
              onClick={() => handleOutcomeClick("no")}
            />
          </RegionRestrictedControl>
        </div>
      </article>
    </>
  );
}
