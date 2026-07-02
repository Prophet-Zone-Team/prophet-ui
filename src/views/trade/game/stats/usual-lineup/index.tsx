"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  buildDualLineupPlacementMap,
  formatLineupPlayerName
} from "@/lib/team/build-dual-lineup-placement";
import type { TeamLineupPlayerView, TeamLineupView } from "@/lib/team/map-team-lineup";
import { cn } from "@/lib/cn";

export type UsualLineupProps = {
  homeLineup?: TeamLineupView;
  awayLineup?: TeamLineupView;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

function LineupPlayerMarker({ player }: { player: TeamLineupPlayerView }) {
  return (
    <>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-prophet-panel text-[16px] font-[500] leading-[20px] text-prophet-foreground">
        {player.number ?? "—"}
      </div>
      <span className="mt-0.5 max-w-[80px] text-center text-[12px] font-[500] leading-[15px] text-prophet-foreground/80">
        {formatLineupPlayerName(player.name)}
      </span>
    </>
  );
}

function DualLineupPitch({
  homeLineup,
  awayLineup
}: {
  homeLineup?: TeamLineupView;
  awayLineup?: TeamLineupView;
}) {
  const homePlacement = useMemo(
    () => buildDualLineupPlacementMap(homeLineup?.starters ?? [], "home"),
    [homeLineup?.starters]
  );
  const awayPlacement = useMemo(
    () => buildDualLineupPlacementMap(awayLineup?.starters ?? [], "away"),
    [awayLineup?.starters]
  );

  return (
    <div className="relative h-[409px] w-full bg-gradient-to-b from-[#ECFFD6] to-[#CFEFAC] dark:from-[#1e2a1a] dark:to-[#243318]">
      {(homeLineup?.starters ?? []).map((player) => {
        const positionStyle = homePlacement.get(player.playerId);

        if (!positionStyle) {
          return null;
        }

        return (
          <div
            key={`home-${player.playerId}`}
            className="absolute flex w-[80px] -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={positionStyle}
          >
            <LineupPlayerMarker player={player} />
          </div>
        );
      })}

      {(awayLineup?.starters ?? []).map((player) => {
        const positionStyle = awayPlacement.get(player.playerId);

        if (!positionStyle) {
          return null;
        }

        return (
          <div
            key={`away-${player.playerId}`}
            className="absolute flex w-[80px] -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={positionStyle}
          >
            <LineupPlayerMarker player={player} />
          </div>
        );
      })}
    </div>
  );
}

function ManagerBlock({
  managerName,
  align
}: {
  managerName?: string;
  align: "start" | "end";
}) {
  const t = useTranslations("trade");

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        align === "end" ? "items-end text-right" : "items-start text-left"
      )}
    >
      <span className="text-[14px] font-[400] leading-[18px] text-prophet-muted">
        {t("manager")}
      </span>
      <span className="truncate text-[14px] font-[500] leading-[18px] text-prophet-foreground">
        {managerName?.trim() || "—"}
      </span>
    </div>
  );
}

export function UsualLineup({
  homeLineup,
  awayLineup,
  isLoading = false,
  isError = false,
  className
}: UsualLineupProps) {
  const t = useTranslations("trade");

  const hasStarters =
    (homeLineup?.starters.length ?? 0) > 0 ||
    (awayLineup?.starters.length ?? 0) > 0;

  return (
    <section
      aria-label={t("usualLineupAria")}
      className={cn(
        "block w-full overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel",
        className
      )}
    >
      <div className="px-4 py-4 sm:px-5">
        <h2 className="m-0 text-[18px] font-[500] leading-[23px] text-prophet-foreground">
          {t("usualLineup")}
        </h2>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4">
          <ManagerBlock align="start" managerName={homeLineup?.coach} />

          <div className="flex flex-col items-center gap-1 px-2">
            <span className="text-[14px] font-[400] leading-[18px] text-prophet-muted">
              {t("formation")}
            </span>
            <div className="flex items-center gap-3 text-[14px] font-[500] leading-[18px] text-prophet-foreground">
              <span>{homeLineup?.formation ?? "—"}</span>
              <span>{awayLineup?.formation ?? "—"}</span>
            </div>
          </div>

          <ManagerBlock align="end" managerName={awayLineup?.coach} />
        </div>
      </div>

      {isLoading ? (
        <p className="px-4 pb-6 text-center text-[14px] font-[400] leading-[17px] text-prophet-muted sm:px-5">
          {t("loadingData")}
        </p>
      ) : isError ? (
        <p className="px-4 pb-6 text-center text-[14px] font-[400] leading-[17px] text-prophet-muted sm:px-5">
          {t("unableToLoadData")}
        </p>
      ) : !hasStarters ? (
        <p className="px-4 pb-6 text-center text-[14px] font-[400] leading-[17px] text-prophet-muted sm:px-5">
          {t("usualLineupEmpty")}
        </p>
      ) : (
        <DualLineupPitch homeLineup={homeLineup} awayLineup={awayLineup} />
      )}
    </section>
  );
}
