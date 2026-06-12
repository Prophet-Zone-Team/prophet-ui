"use client";

import { useTranslations } from "next-intl";

import type { FinishType, PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";

import { BracketPanel } from "./bracket-panel";
import { GroupPanel } from "./group-panel";
import { ResultPanel } from "./result-panel";
import type { RoadStep } from "./step-stepper";
import { StepStepper } from "./step-stepper";
import type { ReferralKickback } from "@/types/referral";

import type { GroupPlacements, KnockoutWinners } from "./types";
import { translateSortMethod } from "./lib/method-keys";
import { Panel } from "./ui/panel";

export function RoadWorkbench({
  activeGroup,
  activeStep,
  advancingThirdGroups,
  calculationErrorKey,
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
  onCopyCurrentLink,
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
  calculationErrorKey?: string;
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
  onCopyCurrentLink: () => void;
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
  const t = useTranslations("roadToFinal");

  return (
    <div>
      <header className="mb-[18px] flex flex-col gap-[14px] md:flex-row md:items-end md:justify-between">
        <div>
          <p className="m-0 text-[12px] font-[700] uppercase tracking-wide text-[#C2410C]">
            {t("pageEyebrow")}
          </p>
          <h1 className="m-0 mt-[6px] text-[clamp(28px,4vw,48px)] font-[400] leading-[1.02] text-black">
            {t("pageTitle")}
          </h1>
          <p className="m-0 mt-[8px] max-w-[760px] text-[15px] leading-[1.55] text-[#909090]">
            {t("pageDescription")}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-[8px] border border-[#EBEBEB] bg-white px-[14px] py-[10px] text-[13px] text-black"
          onClick={() => void onCopyCurrentLink()}
        >
          {t("copyCurrentLink")}
        </button>
      </header>

      <StepStepper
        activeStep={activeStep}
        hasChampion={hasChampion}
        stepOneComplete={stepOneComplete}
        onStepChange={onStepChange}
      />

      {activeStep === 1 ? (
        <section aria-label={t("step1GroupStandingsAria")}>
          <Panel>
            <div>
              <h2 className="m-0 text-[18px] font-[400] text-black">
                {t("step1Title")}
              </h2>
              <p className="m-0 mt-[6px] text-[13px] text-[#909090]">
                {t("step1Description")}
              </p>
            </div>

            <div className="mt-[16px] flex flex-wrap gap-[8px]">
              <ShortcutButton
                label={t("randomFill")}
                onClick={onGroupRandomFill}
                primary
              />
              <ShortcutButton label={t("byFifaRank")} onClick={onGroupFifaFill} />
              <ShortcutButton
                label={t("bySquadValue")}
                onClick={onGroupMarketFill}
              />
              <ShortcutButton
                label={t("resetDefaults")}
                onClick={onGroupReset}
                warn
              />
            </div>

            <div className="mt-[16px] grid grid-cols-2 gap-[10px] sm:grid-cols-4">
              <Metric label={t("groupsComplete")} value="12/12" />
              <Metric
                label={t("thirdPlaceAdvancing")}
                value={`${advancingThirdGroups.length}/8`}
              />
              <Metric
                label={t("annexeC")}
                value={
                  thirdPlaceOption
                    ? t("optionNumber", { option: thirdPlaceOption.option })
                    : t("pending")
                }
              />
              <Metric
                label={t("shortcutBasis")}
                value={translateSortMethod(sortMethod, t)}
              />
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
                {t("step1Requirement")}
              </span>
              <button
                type="button"
                className="rounded-[8px] bg-[#0F766E] px-[14px] py-[10px] text-[13px] text-white"
                onClick={onGoToStep2}
              >
                {t("continueToKnockout")}
              </button>
            </div>
          </Panel>
        </section>
      ) : null}

      {activeStep === 2 ? (
        <section aria-label={t("step2KnockoutAria")}>
          <Panel className="flex flex-col">
            <div className="flex flex-col gap-[12px] lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="m-0 text-[18px] font-[400] text-black">
                  {t("step2Title")}
                </h2>
                <p className="m-0 mt-[6px] text-[13px] text-[#909090]">
                  {t("step2Description")}
                </p>
              </div>
              <div className="flex flex-wrap gap-[8px]">
                <ShortcutButton
                  label={t("randomKnockout")}
                  onClick={onApplyKnockoutRandom}
                  primary
                />
                <ShortcutButton
                  label={t("byFifaRank")}
                  onClick={onApplyKnockoutFifa}
                />
                <ShortcutButton
                  label={t("bySquadValue")}
                  onClick={onApplyKnockoutMarket}
                />
                <ShortcutButton
                  label={t("clearKnockout")}
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
                calculationErrorKey={calculationErrorKey}
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
                {t("backToStep1")}
              </button>
              <button
                type="button"
                className="rounded-[8px] bg-[#0F766E] px-[14px] py-[10px] text-[13px] text-white"
                onClick={onGoToStep3}
              >
                {t("finishAndGenerate")}
              </button>
            </div>
          </Panel>
        </section>
      ) : null}

      {activeStep === 3 ? (
        <section aria-label={t("step3ResultsAria")}>
          <div className="mb-[12px]">
            <h2 className="m-0 text-[18px] font-[400] text-black">
              {t("step3Title")}
            </h2>
            <p className="m-0 mt-[6px] text-[13px] text-[#909090]">
              {t("step3Description")}
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
