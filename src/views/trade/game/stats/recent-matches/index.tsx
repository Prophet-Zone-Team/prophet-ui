"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedLeagueName } from "@/hooks/i18n/use-localized-league-name";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { recentFixturesTableGridClass } from "@/views/trade/game/stats/recent-matches/table-grid";
import type {
  RecentFixtureResult,
  RecentFixtureRow,
  RecentFixturesTeamColumn
} from "@/views/trade/game/stats/recent-matches/types";

export type RecentMatchesTeam = {
  name: string;
  code?: string;
  logoUrl?: string;
};

export type RecentMatchesProps = {
  homeTeam: RecentMatchesTeam;
  awayTeam: RecentMatchesTeam;
  homeRows: RecentFixtureRow[];
  awayRows: RecentFixtureRow[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

function RecentFixtureResultLabel({ result }: { result: RecentFixtureResult }) {
  const t = useTranslations("trade");

  if (result === "win") {
    return (
      <span className="text-[14px] font-[400] uppercase leading-[18px] text-[#65AF14]">
        {t("win")}
      </span>
    );
  }

  if (result === "lose") {
    return (
      <span className="text-[14px] font-[400] uppercase leading-[18px] text-[#FF674B]">
        {t("lose")}
      </span>
    );
  }

  return (
    <span className="text-[14px] font-[400] uppercase leading-[18px] text-[#909090]">
      {t("draw")}
    </span>
  );
}

function RecentFixtureOpponent({ name }: { name: string }) {
  const displayName = useLocalizedTeamName(undefined, name);

  return (
    <span className="truncate text-[14px] font-[400] leading-[18px] text-black">
      {displayName}
    </span>
  );
}

function RecentFixtureCompetition({ name }: { name: string }) {
  const displayName = useLocalizedLeagueName(name);

  return (
    <span
      className="truncate text-[14px] font-[400] leading-[18px] text-[#909090]"
      title={displayName}
    >
      {displayName}
    </span>
  );
}

function RecentFixturesTableHeader() {
  const t = useTranslations("trade");

  return (
    <div
      role="row"
      className={cn(
        recentFixturesTableGridClass,
        "pb-2 text-[14px] font-[400] leading-[18px] text-[#909090]"
      )}
    >
      <span role="columnheader">{t("time")}</span>
      <span role="columnheader">{t("opponent")}</span>
      <span role="columnheader">{t("result")}</span>
      <span role="columnheader">{t("score")}</span>
      <span role="columnheader">{t("competition")}</span>
    </div>
  );
}

function RecentFixturesTableRow({
  row,
  highlighted
}: {
  row: RecentFixtureRow;
  highlighted: boolean;
}) {
  return (
    <div
      role="row"
      className={cn(
        recentFixturesTableGridClass,
        "h-10 rounded-[6px] px-2 text-[14px] leading-[18px]",
        highlighted ? "bg-[#F9FAFC]" : "bg-white"
      )}
    >
      <span className="truncate text-[#909090]">{row.date}</span>
      <RecentFixtureOpponent name={row.opponent} />
      <RecentFixtureResultLabel result={row.result} />
      <span className="whitespace-nowrap text-black">{row.score}</span>
      <RecentFixtureCompetition name={row.competition} />
    </div>
  );
}

function TeamRecentFixturesColumn({
  team,
  rows
}: {
  team: RecentMatchesTeam;
  rows: RecentFixtureRow[];
}) {
  const displayName = useLocalizedTeamName(team.code, team.name);

  return (
    <div className="min-w-0 flex-1 px-3 py-3 md:px-4">
      <div className="flex items-center gap-2">
        <TeamFlag
          code={team.code}
          name={team.name}
          logoUrl={team.logoUrl}
          className="h-[22px] w-[22px] shrink-0 rounded-[6px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
        <span className="truncate text-[14px] font-[500] leading-[18px] text-black">
          {displayName}
        </span>
      </div>

      <div
        role="table"
        className="mt-3 flex w-full flex-col gap-[2px]"
        aria-label={displayName}
      >
        <RecentFixturesTableHeader />
        <div className="flex flex-col gap-[2px]">
          {rows.map((row, index) => (
            <RecentFixturesTableRow
              key={row.id}
              row={row}
              highlighted={index % 2 === 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecentMatches({
  homeTeam,
  awayTeam,
  homeRows,
  awayRows,
  isLoading = false,
  isError = false,
  className
}: RecentMatchesProps) {
  const t = useTranslations("trade");

  const columns: RecentFixturesTeamColumn[] = [
    { ...homeTeam, rows: homeRows },
    { ...awayTeam, rows: awayRows }
  ];

  return (
    <section
      aria-label={t("recentMatchesAria")}
      className={cn(
        "block w-full rounded-[12px] border border-[#EBEBEB] bg-white py-4",
        className
      )}
    >
      <h2 className="m-0 px-4 text-[18px] font-[500] leading-[23px] text-black sm:px-5">
        {t("recentMatches")}
      </h2>

      <div className="mt-3">
        {isLoading ? (
          <p className="px-4 py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090] sm:px-5">
            {t("loadingData")}
          </p>
        ) : isError ? (
          <p className="px-4 py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090] sm:px-5">
            {t("unableToLoadData")}
          </p>
        ) : homeRows.length === 0 && awayRows.length === 0 ? (
          <p className="px-4 py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090] sm:px-5">
            {t("recentMatchesEmpty")}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[#EBEBEB] md:flex-row md:divide-x md:divide-y-0">
            {columns.map((column) => (
              <TeamRecentFixturesColumn
                key={column.name}
                team={column}
                rows={column.rows}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export type { RecentFixtureRow } from "@/views/trade/game/stats/recent-matches/types";
