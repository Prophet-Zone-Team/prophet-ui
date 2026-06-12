"use client";

import { useTranslations } from "next-intl";

import type { PathResult } from "@/types/market";

import { translateRoundLabel } from "../lib/i18n-labels";

export function PathList({ result }: { result: PathResult }) {
  const t = useTranslations("roadToFinal");

  return (
    <div className="flex flex-col gap-[10px]">
      {result.rounds.map((round) => (
        <article
          key={round.round}
          className="rounded-[8px] border border-[#EBEBEB] bg-white p-[12px]"
        >
          <div className="flex items-center justify-between gap-[8px]">
            <strong className="text-[14px] font-[400] text-black">
              {translateRoundLabel(round.round, t)}
            </strong>
            <span className="text-[12px] font-[300] text-[#909090]">
              {round.matchIds.length
                ? round.matchIds.length === 1
                  ? t("matchPrefix", { matchId: round.matchIds[0] })
                  : t("matchPair", {
                      first: round.matchIds[0],
                      second: round.matchIds[1]
                    })
                : t("noMatch")}
            </span>
          </div>
          <p className="m-0 mt-[8px] text-[13px] font-[300] text-[#909090]">
            {round.possibleOpponentTeams
              .slice(0, 8)
              .map((team) => team.teamName)
              .join(", ") || t("pending")}
          </p>
        </article>
      ))}
    </div>
  );
}
