"use client";

import { useState } from "react";

import { CopyButton } from "@/components/feedback/copy-button";
import { useAuth } from "@/context/auth/use-auth";
import { trackCopyLinkClicked } from "@/lib/analytics/tracking";
import { getWorldCupGroupForTeam, getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { TeamFlag } from "@/components/teams/team-flag";
import type { PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { ReferralKickback } from "@/types/referral";

import { ROUND_LABELS } from "../lib/format";
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
  const { isAuthenticated, loginInProgress, openLogin } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const champion = getWorldCupTeamByIdOrCode(championTeamId ?? "");
  return (
    <Panel>
      <div className="flex flex-col gap-[16px] lg:flex-row">
        <article className="flex-1 rounded-[8px] border border-[#EBEBEB] bg-[#FAFAFA] p-[20px]">
          <p className="m-0 text-[12px] font-[700] uppercase tracking-wide text-[#0F766E]">
            2026 World Cup simulation
          </p>
          <h2 className="m-0 mt-[8px] text-[28px] font-[400] leading-[1.1] text-black">
            {champion ? `${champion.name} wins` : "Champion not selected yet"}
          </h2>
          <p className="m-0 mt-[8px] text-[14px] text-[#909090]">
            {champion
              ? "This route is saved in the share link below."
              : "Return to step 2 and pick the winner of match 104."}
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
                  {champion?.name ?? "Pending"}
                </strong>
                <span className="text-[13px] text-[#909090]">
                  {champion
                    ? `${champion.code} · Group ${getWorldCupGroupForTeam(champion.id) ?? "-"}`
                    : "Waiting for final selection"}
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
                    {ROUND_LABELS[round.round]}
                  </small>
                  <strong className="text-[13px] text-black">
                    {round.possibleOpponentTeams
                      .slice(0, 2)
                      .map((team) => team.teamName)
                      .join(" / ") || "Pending"}
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
              Download screenshot
            </button>
          ) : (
            <button
              type="button"
              className="rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black disabled:cursor-wait disabled:opacity-70"
              disabled={loginInProgress}
              onClick={() => void openLogin()}
            >
              {loginInProgress ? "Connecting..." : "Connect wallet"}
            </button>
          )}
          <CopyButton
            text={shareUrl}
            ariaLabel="Copy share link"
            className="w-full rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black"
            onCopy={() =>
              trackCopyLinkClicked({
                target: "share_link",
                label: "Copy share link",
                entrySource: "road_to_final_page"
              })
            }
          >
            Copy share link
          </CopyButton>
          <button
            type="button"
            className="rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black"
            onClick={onBackToKnockout}
          >
            Back to knockout step
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#EBEBEB] bg-white px-[10px] py-[8px]">
      <span className="block text-[11px] text-[#909090]">{label}</span>
      <strong className="text-[13px] text-black">{value}</strong>
    </div>
  );
}
