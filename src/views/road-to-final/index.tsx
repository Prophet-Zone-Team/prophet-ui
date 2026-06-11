"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth/use-auth";
import {
  getWorldCupGroupForTeam,
  getWorldCupTeamByIdOrCode
} from "@/data/world-cup-2026/groups";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";

import { resolveThirdPlaceOption } from "./bracket-graph/bracket-resolver";
import { deriveBestThirdGroups, sortPlacementsBy } from "./lib/group-shortcuts";
import { applyKnockoutShortcut, getChampionTeamId } from "./lib/knockout-shortcuts";
import { safeCalculatePath } from "./lib/calculate-path";
import { getFifaRank, getSquadValue } from "./lib/team-strength";
import { getFinishForTeam, createDefaultPlacements } from "./lib/placements";
import { DEFAULT_THIRD_PLACE_GROUPS } from "./lib/path-config";
import { copyText } from "./lib/share";
import {
  decodeUrlState,
  encodeUrlState,
  hydrateFromUrlPayload
} from "./lib/url-state";
import { isStepOneComplete } from "./lib/validation";
import { defaultSimulatorTeamId } from "./lib/teams";
import type { KnockoutMethodKey, SortMethodKey } from "./lib/method-keys";
import type { RoadStep } from "./step-stepper";
import { RoadWorkbench } from "./workbench";
import type { KnockoutWinners } from "./types";
import { PageBack } from "@/components/ui/page-back";
import type { PathResult } from "@/types/market";

function resolveAllowedStep(
  requested: RoadStep,
  stepOneComplete: boolean,
  hasChampion: boolean
): RoadStep {
  if (requested >= 2 && !stepOneComplete) {
    return 1;
  }

  if (requested >= 3 && !hasChampion) {
    return stepOneComplete ? 2 : 1;
  }

  return requested;
}

export function RoadToFinalPage({
  initialTeamId = defaultSimulatorTeamId
}: {
  initialTeamId?: string;
}) {
  const t = useTranslations("roadToFinal");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const { content: referralContent } = useProphetReferral();
  const funderAddress = session?.funderAddress;
  const kickback = referralContent?.kickback;
  const safeInitialTeamId =
    getWorldCupTeamByIdOrCode(initialTeamId)?.id ?? defaultSimulatorTeamId;

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<RoadStep>(1);
  const [placements, setPlacements] = useState(createDefaultPlacements);
  const [teamId, setTeamId] = useState(safeInitialTeamId);
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const [thirdGroups, setThirdGroups] = useState<string[]>([
    ...DEFAULT_THIRD_PLACE_GROUPS
  ]);
  const [knockoutWinners, setKnockoutWinners] = useState<KnockoutWinners>({});
  const [sortMethod, setSortMethod] = useState<SortMethodKey>("defaultOrder");
  const [knockoutMethod, setKnockoutMethod] =
    useState<KnockoutMethodKey>("manualSelection");
  const [groupErrorKey, setGroupErrorKey] = useState<string | null>(null);
  const [knockoutErrorKey, setKnockoutErrorKey] = useState<string | null>(null);

  useEffect(() => {
    const encodedState = searchParams.get("state");

    if (encodedState) {
      const payload = decodeUrlState(encodedState);

      if (payload) {
        const hydratedState = hydrateFromUrlPayload(payload, safeInitialTeamId);
        const nextPlacements = hydratedState.placements ?? createDefaultPlacements();
        const nextThirdGroups = hydratedState.thirdGroups ?? [
          ...DEFAULT_THIRD_PLACE_GROUPS
        ];
        const nextKnockoutWinners = hydratedState.knockoutWinners ?? {};
        const nextStepOneComplete = isStepOneComplete(
          nextPlacements,
          nextThirdGroups
        );
        const nextHasChampion = Boolean(getChampionTeamId(nextKnockoutWinners));

        setPlacements(nextPlacements);
        setThirdGroups(nextThirdGroups);

        if (hydratedState.teamId) {
          setTeamId(hydratedState.teamId);
        }

        setKnockoutWinners(nextKnockoutWinners);

        if (hydratedState.sortMethod) {
          setSortMethod(hydratedState.sortMethod as SortMethodKey);
        }

        if (hydratedState.knockoutMethod) {
          setKnockoutMethod(hydratedState.knockoutMethod as KnockoutMethodKey);
        }

        if (hydratedState.step) {
          setStep(
            resolveAllowedStep(
              hydratedState.step,
              nextStepOneComplete,
              nextHasChampion
            )
          );
        }
      }
    }

    setHydrated(true);
  }, [safeInitialTeamId, searchParams]);

  const activeGroup = getWorldCupGroupForTeam(teamId) ?? "C";
  const finishType = getFinishForTeam(placements, teamId) ?? "GROUP_WINNER";
  const advancingThirdGroups = useMemo(
    () => thirdGroups.slice().sort(),
    [thirdGroups]
  );
  const stepOneComplete = isStepOneComplete(placements, advancingThirdGroups);
  const thirdPlaceOption = resolveThirdPlaceOption(advancingThirdGroups);
  const championTeamId = getChampionTeamId(knockoutWinners);
  const hasChampion = Boolean(championTeamId);

  const calculation = useMemo((): {
    result?: PathResult;
    errorKey?: "errorCompleteStep1Bracket";
  } => {
    if (!stepOneComplete) {
      return { errorKey: "errorCompleteStep1Bracket" };
    }

    const outcome = safeCalculatePath({
      teamId,
      finishType,
      thirdGroups: advancingThirdGroups,
      placements
    });

    if (outcome.error) {
      return { errorKey: "errorCompleteStep1Bracket" };
    }

    return outcome;
  }, [advancingThirdGroups, finishType, placements, stepOneComplete, teamId]);

  const result = calculation.result;

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set(
      "state",
      encodeUrlState({
        placements,
        thirdGroups: advancingThirdGroups,
        teamId,
        knockoutWinners,
        sortMethod,
        knockoutMethod,
        step
      })
    );
    return url.toString();
  }, [
    advancingThirdGroups,
    knockoutMethod,
    knockoutWinners,
    placements,
    sortMethod,
    step,
    teamId
  ]);

  const writeUrlState = useCallback(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set(
      "state",
      encodeUrlState({
        placements,
        thirdGroups: advancingThirdGroups,
        teamId,
        knockoutWinners,
        sortMethod,
        knockoutMethod,
        step
      })
    );
    router.replace(`${pathname}?${url.searchParams.toString()}`, { scroll: false });
  }, [
    advancingThirdGroups,
    hydrated,
    knockoutMethod,
    knockoutWinners,
    pathname,
    placements,
    router,
    sortMethod,
    step,
    teamId
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    writeUrlState();
  }, [hydrated, writeUrlState]);

  const resetKnockout = () => {
    setKnockoutWinners({});
    setKnockoutMethod("manualSelection");
  };

  const applyGroupSort = (
    method: SortMethodKey,
    sorter: Parameters<typeof sortPlacementsBy>[0]
  ) => {
    const nextPlacements = sortPlacementsBy(sorter);
    setPlacements(nextPlacements);
    setThirdGroups(deriveBestThirdGroups(nextPlacements, method));
    setSortMethod(method);
    resetKnockout();
    setTeamId(nextPlacements.C?.first || defaultSimulatorTeamId);
    setGroupErrorKey(null);
  };

  const stepTo = (nextStep: RoadStep) => {
    if (nextStep === 2 && !stepOneComplete) {
      setStep(1);
      setGroupErrorKey("errorCompleteStep1Knockout");
      return;
    }

    if (nextStep === 3 && (!stepOneComplete || !hasChampion)) {
      setStep(2);
      setKnockoutErrorKey("errorCompleteStepsForResult");
      return;
    }

    setStep(resolveAllowedStep(nextStep, stepOneComplete, hasChampion));
    setGroupErrorKey(null);
    setKnockoutErrorKey(null);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const applyKnockoutFill = (
    method: KnockoutMethodKey,
    fillMethod: "random" | "fifa" | "market"
  ) => {
    if (!stepOneComplete) {
      setKnockoutErrorKey("errorCompleteStep1Shortcuts");
      return;
    }

    if (!thirdPlaceOption) {
      setKnockoutErrorKey("errorAnnexeCNotReady");
      return;
    }

    setKnockoutWinners(
      applyKnockoutShortcut({
        placements,
        thirdPlaceOption,
        method: fillMethod
      })
    );
    setKnockoutMethod(method);
    setKnockoutErrorKey(null);
  };

  return (
    <div className="relative mx-auto w-full max-w-[1600px] px-4 pb-8 pt-[10px]">
      <div className="pb-[10px]">
        <PageBack />
      </div>
      <RoadWorkbench
        activeGroup={activeGroup}
        activeStep={step}
        advancingThirdGroups={advancingThirdGroups}
        calculationErrorKey={calculation.errorKey}
        championTeamId={championTeamId}
        funderAddress={funderAddress}
        kickback={kickback}
        finishType={finishType}
        groupError={groupErrorKey ? t(groupErrorKey) : null}
        hasChampion={hasChampion}
        knockoutError={knockoutErrorKey ? t(knockoutErrorKey) : null}
        knockoutMethod={knockoutMethod}
        knockoutWinners={knockoutWinners}
        onApplyKnockoutFifa={() => applyKnockoutFill("fifaRank", "fifa")}
        onApplyKnockoutMarket={() => applyKnockoutFill("squadValueRanking", "market")}
        onApplyKnockoutRandom={() => applyKnockoutFill("randomFill", "random")}
        onBackToStep1={() => stepTo(1)}
        onBackToStep2={() => stepTo(2)}
        onCopyCurrentLink={() => void copyText(shareUrl)}
        onGoToStep2={() => stepTo(2)}
        onGoToStep3={() => stepTo(3)}
        onGroupFifaFill={() =>
          applyGroupSort(
            "fifaRank",
            (a, b) => getFifaRank(a.id) - getFifaRank(b.id)
          )
        }
        onGroupMarketFill={() =>
          applyGroupSort(
            "squadValueRanking",
            (a, b) => getSquadValue(b.id) - getSquadValue(a.id)
          )
        }
        onGroupRandomFill={() =>
          applyGroupSort("randomFill", () => Math.random() - 0.5)
        }
        onGroupReset={() => {
          setPlacements(createDefaultPlacements());
          setThirdGroups([...DEFAULT_THIRD_PLACE_GROUPS]);
          setSortMethod("defaultOrder");
          resetKnockout();
          setGroupErrorKey(null);
        }}
        onKnockoutClear={resetKnockout}
        onKnockoutReset={resetKnockout}
        onKnockoutWinnersChange={(winners) => {
          setKnockoutWinners(winners);
          setKnockoutMethod("manualSelection");
        }}
        onPlacementsChange={setPlacements}
        onSelectTeam={setTeamId}
        onStepChange={stepTo}
        onTeamChange={setTeamId}
        onThirdGroupsChange={setThirdGroups}
        onViewModeChange={setViewMode}
        placements={placements}
        result={result}
        shareUrl={shareUrl}
        sortMethod={sortMethod}
        stepOneComplete={stepOneComplete}
        teamId={teamId}
        thirdPlaceOption={thirdPlaceOption}
        viewMode={viewMode}
      />
    </div>
  );
}
