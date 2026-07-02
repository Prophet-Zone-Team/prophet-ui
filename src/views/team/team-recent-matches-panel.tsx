"use client";

import { useTranslations } from "next-intl";

import {
  curatedAbbreviationToCode,
  findCuratedEntryByName,
  findCuratedTeamByFuzzyLabel
} from "@/data/teams/curated-team-list";
import { useLocalizedLeagueName } from "@/hooks/i18n/use-localized-league-name";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import type { RecentMatchView } from "@/lib/team/team-detail-model";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamRecentMatchesPanelProps {
  matches: RecentMatchView[];
}

function resolveOpponentCode(name: string): string | undefined {
  const entry = findCuratedEntryByName(name);

  if (entry) {
    return curatedAbbreviationToCode(entry.abbreviation);
  }

  return findCuratedTeamByFuzzyLabel(name)?.code;
}

function RecentMatchOpponent({ name }: { name: string }) {
  const displayName = useLocalizedTeamName(resolveOpponentCode(name), name);

  return <strong className="font-[500] text-prophet-foreground">{displayName}</strong>;
}

function RecentMatchCompetition({ note }: { note: string }) {
  const displayName = useLocalizedLeagueName(note);

  return (
    <p className="m-0 truncate text-xs text-prophet-muted">{displayName}</p>
  );
}

export function TeamRecentMatchesPanel({
  matches
}: TeamRecentMatchesPanelProps) {
  const t = useTranslations("teamDetail");

  return (
    <section className={teamPanelClass} aria-label={t("recentMatchesAria")}>
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("recentMatches")}</h2>
      </div>
      <div className="p-4">
        {matches.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[460px]">
              <div className="grid grid-cols-[140px_1fr_48px_72px_1fr] gap-2 border-b border-prophet-line pb-2 text-[10px] font-[500] uppercase tracking-wide text-prophet-muted">
                <span>{t("date")}</span>
                <span>{t("opponent")}</span>
                <span>{t("result")}</span>
                <span>{t("score")}</span>
                <span>{t("competition")}</span>
              </div>
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="grid grid-cols-[140px_1fr_48px_72px_1fr] gap-2 border-b border-prophet-line py-2.5 text-sm last:border-b-0"
                >
                  <span className="text-prophet-muted text-[10px]">
                    {match.date}
                  </span>
                  <RecentMatchOpponent name={match.opponent} />
                  <b
                    className={
                      match.result === "W"
                        ? "font-[500] text-prophet-green"
                        : match.result === "L"
                          ? "font-[500] text-prophet-red"
                          : "font-[500] text-prophet-muted"
                    }
                  >
                    {match.result}
                  </b>
                  <span>{match.score}</span>
                  <RecentMatchCompetition note={match.note} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <TeamEmptyState
            title={t("noRecentResultData")}
            body={t("noRecentResultDataBody")}
          />
        )}
      </div>
    </section>
  );
}
