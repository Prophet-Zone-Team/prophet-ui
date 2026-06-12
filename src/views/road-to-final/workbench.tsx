"use client";

import { CopyButton } from "@/components/feedback/copy-button";
import { trackCopyLinkClicked } from "@/lib/analytics/tracking";
import type { FinishType, PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";

import { BracketPanel } from "./bracket-panel";
import { GroupPanel } from "./group-panel";
import { ResultPanel } from "./result-panel";
import { SummaryPanel } from "./summary-panel";
import type { RoadStep } from "./step-stepper";
import { StepStepper } from "./step-stepper";
import type { ReferralKickback } from "@/types/referral";

import type { GroupPlacements, KnockoutWinners } from "./types";
import { Panel } from "./ui/panel";

export function RoadWorkbench({
  activeGroup,
  activeStep,
  advancingThirdGroups,
  calculationError,
  championTeamId,
  funderAddress,
  kickback,
  finishType,
  groupError,
  hasChampion,
  knockoutError,
  knockoutMethod,
  knockoutWinners,
  onApplyKnockoutFifa,
  onApplyKnockoutMarket,
  onApplyKnockoutRandom,
  onBackToStep1,
  onBackToStep2,
  onGoToStep2,
  onGoToStep3,
  onGroupFifaFill,
  onGroupMarketFill,
  onGroupRandomFill,
  onGroupReset,
  onKnockoutClear,
  onKnockoutReset,
  onKnockoutWinnersChange,
  onPlacementsChange,
  onSelectTeam,
  onStepChange,
  onTeamChange,
  onThirdGroupsChange,
  onViewModeChange,
  placements,
  result,
  shareUrl,
  sortMethod,
  stepOneComplete,
  teamId,
  thirdPlaceOption,
  viewMode
}: {
  activeGroup: WorldCup2026Group;
  activeStep: RoadStep;
  advancingThirdGroups: string[];
  calculationError?: string;
  championTeamId?: string;
  funderAddress?: string;
  kickback?: ReferralKickback;
  finishType: FinishType;
  groupError?: string | null;
  hasChampion: boolean;
  knockoutError?: string | null;
  knockoutMethod: string;
  knockoutWinners: KnockoutWinners;
  onApplyKnockoutFifa: () => void;
  onApplyKnockoutMarket: () => void;
  onApplyKnockoutRandom: () => void;
  onBackToStep1: () => void;
  onBackToStep2: () => void;
  onGoToStep2: () => void;
  onGoToStep3: () => void;
  onGroupFifaFill: () => void;
  onGroupMarketFill: () => void;
  onGroupRandomFill: () => void;
  onGroupReset: () => void;
  onKnockoutClear: () => void;
  onKnockoutReset: () => void;
  onKnockoutWinnersChange: (winners: KnockoutWinners) => void;
  onPlacementsChange: (placements: GroupPlacements) => void;
  onSelectTeam: (teamId: string) => void;
  onStepChange: (step: RoadStep) => void;
  onTeamChange: (teamId: string) => void;
  onThirdGroupsChange: (groups: string[]) => void;
  onViewModeChange: (mode: "graph" | "list") => void;
  placements: GroupPlacements;
  result?: PathResult;
  shareUrl: string;
  sortMethod: string;
  stepOneComplete: boolean;
  teamId: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  viewMode: "graph" | "list";
}) {
  return (
    <div>
      <header className="mb-[18px] flex flex-col gap-[14px] md:flex-row md:items-end md:justify-between">
        <div>
          <p className="m-0 text-[12px] font-[700] uppercase tracking-wide text-[#C2410C]">
            Road to Final · 2026
          </p>
          <h1 className="m-0 mt-[6px] text-[clamp(28px,4vw,48px)] font-[400] leading-[1.02] text-black">
            Build your World Cup champion route in three steps
          </h1>
          <p className="m-0 mt-[8px] max-w-[760px] text-[15px] leading-[1.55] text-[#909090]">
            Set all 12 group standings, pick knockout winners through the final,
            then share a screenshot and reproducible link.
          </p>
        </div>
        <CopyButton
          text={shareUrl}
          ariaLabel="Copy current link"
          className="shrink-0 rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black"
          onCopy={() =>
            trackCopyLinkClicked({
              target: "share_link",
              label: "Copy current link",
              entrySource: "road_to_final_page"
            })
          }
        >
          Copy current link
        </CopyButton>
      </header>

      <StepStepper
        activeStep={activeStep}
        hasChampion={hasChampion}
        stepOneComplete={stepOneComplete}
        onStepChange={onStepChange}
      />

      {activeStep === 1 ? (
        <section aria-label="Step 1 group standings">
          <Panel>
            <div>
              <h2 className="m-0 text-[18px] font-[400] text-black">
                Step 1: Group standings
              </h2>
              <p className="m-0 mt-[6px] text-[13px] text-[#909090]">
                Assign 1st through 4th in each group. Third-place advancement
                affects Annexe C bracket slots.
              </p>
            </div>

            <div className="mt-[16px] flex flex-wrap gap-[8px]">
              <ShortcutButton
                label="Random fill"
                onClick={onGroupRandomFill}
                primary
              />
              <ShortcutButton label="By FIFA rank" onClick={onGroupFifaFill} />
              <ShortcutButton
                label="By squad value"
                onClick={onGroupMarketFill}
              />
              <ShortcutButton
                label="Reset defaults"
                onClick={onGroupReset}
                warn
              />
            </div>

            <div className="mt-[16px] grid grid-cols-2 gap-[10px] sm:grid-cols-4">
              <Metric label="Groups complete" value="12/12" />
              <Metric
                label="Third-place advancing"
                value={`${advancingThirdGroups.length}/8`}
              />
              <Metric
                label="Annexe C"
                value={
                  thirdPlaceOption
                    ? `Option ${thirdPlaceOption.option}`
                    : "Pending"
                }
              />
              <Metric label="Shortcut basis" value={sortMethod} />
            </div>

            <div className="mt-[16px]">
              <GroupPanel
                activeGroup={activeGroup}
                placements={placements}
                selectedTeamId={teamId}
                thirdGroups={advancingThirdGroups}
                onPlacementsChange={onPlacementsChange}
                onSelectTeam={onSelectTeam}
                onThirdGroupsChange={onThirdGroupsChange}
                onKnockoutReset={onKnockoutReset}
                hideToolbar
              />
            </div>

            {groupError ? (
              <div className="mt-[16px] rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-[12px] text-[13px] text-[#991B1B]">
                {groupError}
              </div>
            ) : null}

            <div className="mt-[16px] flex flex-col gap-[10px] border-t border-[#EBEBEB] pt-[16px] sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[13px] text-[#909090]">
                Requirement: all groups ranked 1-4 with exactly 8 third-place
                groups advancing.
              </span>
              <button
                type="button"
                className="rounded-[8px] bg-[#0F766E] px-[14px] py-[10px] text-[13px] text-white"
                onClick={onGoToStep2}
              >
                Continue to knockout (R32)
              </button>
            </div>
          </Panel>
        </section>
      ) : null}

      {activeStep === 2 ? (
        <section aria-label="Step 2 knockout bracket">
          <Panel className="flex flex-col">
            <div className="flex flex-col gap-[12px] lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="m-0 text-[18px] font-[400] text-black">
                  Step 2: Knockout to champion
                </h2>
                <p className="m-0 mt-[6px] text-[13px] text-[#909090]">
                  Pick the winner in each match, or use shortcuts to fill the
                  bracket in one pass.
                </p>
              </div>
              <div className="flex flex-wrap gap-[8px]">
                <ShortcutButton
                  label="Random knockout"
                  onClick={onApplyKnockoutRandom}
                  primary
                />
                <ShortcutButton
                  label="By FIFA rank"
                  onClick={onApplyKnockoutFifa}
                />
                <ShortcutButton
                  label="By squad value"
                  onClick={onApplyKnockoutMarket}
                />
                <ShortcutButton
                  label="Clear knockout"
                  onClick={onKnockoutClear}
                />
              </div>
            </div>

            {knockoutError ? (
              <div className="mt-[16px] rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-[12px] text-[13px] text-[#991B1B]">
                {knockoutError}
              </div>
            ) : null}

            <div className="mt-[16px]">
              <BracketPanel
                calculationError={calculationError}
                finishType={finishType}
                knockoutWinners={knockoutWinners}
                onKnockoutWinnersChange={onKnockoutWinnersChange}
                onPlacementsChange={onPlacementsChange}
                onTeamChange={onTeamChange}
                onViewModeChange={onViewModeChange}
                placements={placements}
                result={result}
                teamId={teamId}
                thirdPlaceOption={thirdPlaceOption}
                viewMode={viewMode}
                embedded
              />
            </div>

            <div className="mt-[16px] flex flex-wrap justify-end gap-[8px] border-t border-[#EBEBEB] pt-[16px]">
              <button
                type="button"
                className="rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black"
                onClick={onBackToStep1}
              >
                Back to step 1
              </button>
              <button
                type="button"
                className="rounded-[8px] bg-[#0F766E] px-[14px] py-[10px] text-[13px] text-white"
                onClick={onGoToStep3}
              >
                Finish and generate result
              </button>
            </div>
          </Panel>
        </section>
      ) : null}

      {activeStep === 3 ? (
        <section aria-label="Step 3 results and sharing">
          <div className="mb-[12px]">
            <h2 className="m-0 text-[18px] font-[400] text-black">
              Step 3: Results and sharing
            </h2>
            <p className="m-0 mt-[6px] text-[13px] text-[#909090]">
              The share link includes group standings, third-place groups, and
              knockout selections.
            </p>
          </div>
          <ResultPanel
            advancingThirdGroups={advancingThirdGroups}
            championTeamId={championTeamId}
            funderAddress={funderAddress}
            kickback={kickback}
            knockoutMethod={knockoutMethod}
            knockoutWinners={knockoutWinners}
            placements={placements}
            result={result}
            shareUrl={shareUrl}
            sortMethod={sortMethod}
            teamId={teamId}
            thirdPlaceOption={thirdPlaceOption}
            onBackToKnockout={onBackToStep2}
          />
        </section>
      ) : null}
    </div>
  );
}

function ShortcutButton({
  label,
  onClick,
  primary,
  warn
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        primary
          ? "rounded-[8px] bg-[#18110F] px-[12px] py-[8px] text-[13px] text-white"
          : warn
            ? "rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-[12px] py-[8px] text-[13px] text-[#991B1B]"
            : "rounded-[8px] border border-[#EBEBEB] bg-white px-[12px] py-[8px] text-[13px] text-black"
      }
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#EBEBEB] bg-[#FAFAFA] px-[10px] py-[8px]">
      <span className="block text-[11px] text-[#909090]">{label}</span>
      <strong className="text-[13px] text-black">{value}</strong>
    </div>
  );
}
