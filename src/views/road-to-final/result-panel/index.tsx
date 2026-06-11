"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/feedback/copy-button";
import { useAuth } from "@/context/auth/use-auth";
import {
  getWorldCupGroupForTeam,
  getWorldCupTeamByIdOrCode
} from "@/data/world-cup-2026/groups";
import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { resolveLocalizedTeamName } from "@/lib/i18n/localized-team-name";
import type { PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { ReferralKickback } from "@/types/referral";

import { translateRoundLabel } from "../lib/i18n-labels";
import { RoadToFinalShareModal } from "../road-to-final-share-modal";
import type { GroupPlacements, KnockoutWinners } from "../types";
import { Panel } from "../ui/panel";

export function ResultPanel({
  advancingThirdGroups,
  championTeamId,
  funderAddress,
  kickback,
  knockoutMethod,
  knockoutWinners,
  placements,
  result,
  shareUrl,
  sortMethod,
  teamId,
  thirdPlaceOption,
  onBackToKnockout
}: {
  advancingThirdGroups: string[];
  championTeamId?: string;
  funderAddress?: string;
  kickback?: ReferralKickback;
  knockoutMethod: string;
  knockoutWinners: KnockoutWinners;
  placements: GroupPlacements;
  result?: PathResult;
  shareUrl: string;
  sortMethod: string;
  teamId: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  onBackToKnockout: () => void;
}) {
  const t = useTranslations("roadToFinal");
  const tTeamNames = useTranslations("teamNames");
  const { isAuthenticated, loginInProgress, openLogin } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const champion = getWorldCupTeamByIdOrCode(championTeamId ?? "");
  const championName = useLocalizedTeamName(
    champion?.code ?? "",
    champion?.name ?? ""
  );

  return (
    <Panel>
      <div className="flex flex-col gap-[16px] lg:flex-row">
        <article className="flex-1 rounded-[8px] border border-[#EBEBEB] bg-[#FAFAFA] p-[20px]">
          <p className="m-0 text-[12px] font-[700] uppercase tracking-wide text-[#0F766E]">
            {t("worldCupSimulation")}
          </p>
          <h2 className="m-0 mt-[8px] text-[28px] font-[400] leading-[1.1] text-black">
            {champion
              ? t("championWins", { name: championName })
              : t("championNotSelected")}
          </h2>
          <p className="m-0 mt-[8px] text-[14px] text-[#909090]">
            {champion ? t("routeSavedInShareLink") : t("returnToStep2Match104")}
          </p>

          <div className="mt-[18px] flex items-center gap-[12px]">
            <span className="text-[28px]" aria-hidden>
              🏆
            </span>
            <div className="flex items-center gap-[10px]">
              <TeamFlag
                code={champion?.code}
                name={champion?.name}
                className="h-[40px] w-[40px] rounded-[6px] text-[40px]"
              />
              <div>
                <strong className="block text-[18px] text-black">
                  {champion ? championName : t("pending")}
                </strong>
                <span className="text-[13px] text-[#909090]">
                  {champion
                    ? t("teamGroupMeta", {
                        code: champion.code,
                        group: getWorldCupGroupForTeam(champion.id) ?? "-"
                      })
                    : t("waitingForFinalSelection")}
                </span>
              </div>
            </div>
          </div>

          {result ? (
            <div className="mt-[16px] flex flex-wrap gap-[8px]">
              {result.rounds.map((round) => (
                <div
                  key={round.round}
                  className="rounded-[8px] border border-[#EBEBEB] bg-white px-[10px] py-[8px]"
                >
                  <small className="block text-[11px] text-[#909090]">
                    {translateRoundLabel(round.round, t)}
                  </small>
                  <strong className="text-[13px] text-black">
                    {round.possibleOpponentTeams
                      .slice(0, 2)
                      .map((team) => {
                        const meta = getWorldCupTeamByIdOrCode(team.teamId);

                        return resolveLocalizedTeamName(
                          meta?.code,
                          team.teamName,
                          tTeamNames
                        );
                      })
                      .join(" / ") || t("pending")}
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <aside className="flex w-full shrink-0 flex-col gap-[8px] lg:w-[280px]">
          {isAuthenticated ? (
            <button
              type="button"
              className="rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black"
              onClick={() => setShareOpen(true)}
            >
              {t("downloadScreenshot")}
            </button>
          ) : (
            <button
              type="button"
              className="rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black disabled:cursor-wait disabled:opacity-70"
              disabled={loginInProgress}
              onClick={() => void openLogin()}
            >
              {loginInProgress ? t("connecting") : t("connectWallet")}
            </button>
          )}
          <CopyButton
            text={shareUrl}
            ariaLabel={t("copyShareLinkAria")}
            className="w-full rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black"
          >
            {t("copyShareLink")}
          </CopyButton>
          <button
            type="button"
            className="rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black"
            onClick={onBackToKnockout}
          >
            {t("backToKnockoutStep")}
          </button>
        </aside>
      </div>

      <RoadToFinalShareModal
        open={shareOpen && isAuthenticated}
        onClose={() => setShareOpen(false)}
        teamId={teamId}
        championTeamId={championTeamId}
        advancingThirdGroups={advancingThirdGroups}
        result={result}
        placements={placements}
        knockoutWinners={knockoutWinners}
        thirdPlaceOption={thirdPlaceOption}
        funderAddress={funderAddress}
        kickback={kickback}
      />
    </Panel>
  );
}
