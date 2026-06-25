"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import { useAuth } from "@/context/auth/use-auth";
import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { useWinnerProbability } from "@/hooks/market/use-winner-probability";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";
import { useWinnerRecords } from "@/hooks/road-to-final/use-winner-records";
import { useWinnerStats } from "@/hooks/road-to-final/use-winner-stats";
import {
  hasPersistedRoadToFinalStorage,
  useRoadToFinalHydrated,
  useRoadToFinalStore,
} from "@/store/road-to-final-store";
import dynamic from "next/dynamic";

import { resolveThirdPlaceOption } from "./lib/bracket-resolver";
import { safeCalculatePath } from "./lib/calculate-path";
import {
  FIXED_GROUP_PLACEMENTS,
  FIXED_THIRD_PLACE_GROUPS
} from "./lib/fixed-group-stage";
import {
  applyKnockoutShortcut as runKnockoutShortcut,
  getChampionTeamId
} from "./lib/knockout-shortcuts";
import { getUnpickedKnockoutMatchIds } from "./lib/knockout-validation";
import { getFinishForTeam } from "./lib/placements";
import type { KnockoutPickMethod } from "./lib/team-strength";
import {
  decodeUrlState,
  hydrateFromUrlPayload,
} from "./lib/url-state";
import { replaceRoadToFinalUrlState } from "./lib/url-state-sync";
import { isStepOneComplete } from "./lib/validation";
import { defaultSimulatorTeamId } from "./lib/teams";
import type { KnockoutMethodKey } from "./lib/method-keys";
import type { KnockoutWinners } from "./types";
import { CampaignRulesModal } from "./campaign-rules-modal";
import { KnockoutBracket } from "./knockout-bracket";
import { RoadToFinalPageShell } from "./page-shell";
import { PredictionRecordsModal } from "./prediction-records-modal";
import { RoadToFinalShareModal } from "./road-to-final-share-modal";
import { ShareFooter } from "./share-footer";

const LightRays = dynamic(() => import("@/components/light-rays"), { ssr: false });

const KNOCKOUT_METHOD_TO_PICK: Record<
  Exclude<KnockoutMethodKey, "manualSelection">,
  KnockoutPickMethod
> = {
  randomFill: "random",
  fifaRank: "fifa",
  squadValueRanking: "market"
};

export function RoadToFinalPage({
  initialTeamId = defaultSimulatorTeamId
}: {
  initialTeamId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeHydrated = useRoadToFinalHydrated();
  const hasAppliedInitialUrlState = useRef(false);
  const { session, isAuthenticated } = useAuth();
  const { content: referralContent } = useProphetReferral();
  const { records, count: predictionCount, isLoading: recordsLoading, isError: recordsError } =
    useWinnerRecords();
  const {
    availableChances,
    tradePromptAmount,
    isLoading: statsLoading
  } = useWinnerStats();
  const { probabilityByTeamId } = useWinnerProbability();
  const funderAddress = session?.funderAddress;
  const kickback = referralContent?.kickback;

  const safeInitialTeamId =
    getWorldCupTeamByIdOrCode(initialTeamId)?.id ?? defaultSimulatorTeamId;

  const {
    teamId,
    knockoutWinners,
    knockoutMethod,
    setTeamId,
    setKnockoutWinners,
    setKnockoutMethod,
    applySharedState,
    clearKnockoutSelections,
  } = useRoadToFinalStore(
    useShallow((state) => ({
      teamId: state.teamId,
      knockoutWinners: state.knockoutWinners,
      knockoutMethod: state.knockoutMethod,
      setTeamId: state.setTeamId,
      setKnockoutWinners: state.setKnockoutWinners,
      setKnockoutMethod: state.setKnockoutMethod,
      applySharedState: state.applySharedState,
      clearKnockoutSelections: state.clearKnockoutSelections,
    }))
  );

  const placements = FIXED_GROUP_PLACEMENTS;
  const advancingThirdGroups = useMemo(
    () => [...FIXED_THIRD_PLACE_GROUPS].sort(),
    []
  );

  const [urlHydrated, setUrlHydrated] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [validationErrorMatchIds, setValidationErrorMatchIds] = useState<
    ReadonlySet<number>
  >(() => new Set());

  useEffect(() => {
    if (!storeHydrated || hasAppliedInitialUrlState.current) {
      return;
    }

    hasAppliedInitialUrlState.current = true;

    const encodedState = searchParams.get("state");

    if (encodedState) {
      const payload = decodeUrlState(encodedState);

      if (payload) {
        applySharedState(hydrateFromUrlPayload(payload, safeInitialTeamId));
      }
    } else if (
      !hasPersistedRoadToFinalStorage() &&
      safeInitialTeamId !== defaultSimulatorTeamId
    ) {
      setTeamId(safeInitialTeamId);
    }

    setUrlHydrated(true);
  }, [
    applySharedState,
    safeInitialTeamId,
    searchParams,
    setTeamId,
    storeHydrated,
  ]);

  const stepOneComplete = isStepOneComplete(placements, advancingThirdGroups);
  const thirdPlaceOption = resolveThirdPlaceOption(advancingThirdGroups);
  const championTeamId = getChampionTeamId(knockoutWinners);
  const hasChampion = Boolean(championTeamId);
  const shareTeamId = championTeamId ?? teamId;

  const sharePathResult = useMemo(() => {
    if (!stepOneComplete || !shareTeamId) {
      return undefined;
    }

    const finishType = getFinishForTeam(placements, shareTeamId);

    if (!finishType) {
      return undefined;
    }

    return safeCalculatePath({
      teamId: shareTeamId,
      finishType,
      thirdGroups: advancingThirdGroups,
      placements
    }).result;
  }, [advancingThirdGroups, placements, shareTeamId, stepOneComplete]);

  const writeUrlState = useCallback(() => {
    if (!urlHydrated) {
      return;
    }

    replaceRoadToFinalUrlState(router, pathname, {
      teamId,
      knockoutWinners,
      knockoutMethod
    });
  }, [knockoutMethod, knockoutWinners, pathname, router, teamId, urlHydrated]);

  useEffect(() => {
    if (!urlHydrated) {
      return;
    }

    writeUrlState();
  }, [urlHydrated, writeUrlState]);

  const handleKnockoutFill = (method: KnockoutMethodKey) => {
    if (!thirdPlaceOption || method === "manualSelection") {
      return;
    }

    const pickMethod = KNOCKOUT_METHOD_TO_PICK[method];
    const nextWinners = runKnockoutShortcut({
      placements,
      thirdPlaceOption,
      method: pickMethod
    });

    setKnockoutWinners(nextWinners);
    setKnockoutMethod(method);
    setValidationErrorMatchIds(new Set());

    const nextChampion = getChampionTeamId(nextWinners);

    if (nextChampion) {
      setTeamId(nextChampion);
    }
  };

  const handleKnockoutWinnersChange = (winners: KnockoutWinners) => {
    setKnockoutWinners(winners);
    setKnockoutMethod("manualSelection");

    setValidationErrorMatchIds((current) => {
      if (current.size === 0) {
        return current;
      }

      const next = new Set(current);

      for (const matchId of current) {
        if (winners[matchId]) {
          next.delete(matchId);
        }
      }

      return next.size === current.size ? current : next;
    });
  };

  const handleBeforeShare = useCallback((): boolean => {
    const missing = getUnpickedKnockoutMatchIds(
      placements,
      thirdPlaceOption,
      knockoutWinners
    );

    if (missing.length > 0) {
      setValidationErrorMatchIds(new Set(missing));
      return false;
    }

    setValidationErrorMatchIds(new Set());
    return true;
  }, [knockoutWinners, placements, thirdPlaceOption]);

  const handleClearKnockout = useCallback(() => {
    clearKnockoutSelections();
    setValidationErrorMatchIds(new Set());

    if (urlHydrated) {
      replaceRoadToFinalUrlState(router, pathname, {
        teamId: defaultSimulatorTeamId,
        knockoutWinners: {},
        knockoutMethod: "manualSelection",
      });
    }
  }, [clearKnockoutSelections, pathname, router, urlHydrated]);

  return (
    <div className="relative mx-auto w-full">
      <RoadToFinalPageShell
        knockoutMethod={knockoutMethod}
        onRandomFill={() => handleKnockoutFill("randomFill")}
        onFifaFill={() => handleKnockoutFill("fifaRank")}
        onValueFill={() => handleKnockoutFill("squadValueRanking")}
        onClear={handleClearKnockout}
      />

      <div className="-mt-[12px] bg-[#0B1020]">
        <KnockoutBracket
          placements={placements}
          thirdPlaceOption={thirdPlaceOption}
          knockoutWinners={knockoutWinners}
          championTeamId={championTeamId}
          hasChampion={hasChampion}
          disabled={!stepOneComplete || !thirdPlaceOption}
          onKnockoutWinnersChange={handleKnockoutWinnersChange}
          probabilityByTeamId={probabilityByTeamId}
          validationErrorMatchIds={validationErrorMatchIds}
        />

        <ShareFooter
          predictionCount={predictionCount}
          availableChances={availableChances}
          tradePromptAmount={tradePromptAmount}
          statsLoading={statsLoading || recordsLoading}
          onBeforeShare={handleBeforeShare}
          onShare={() => {
            setShareOpen(true);
          }}
          onOpenRecords={() => setRecordsOpen(true)}
          onOpenRules={() => setRulesOpen(true)}
        />
      </div>

      <RoadToFinalShareModal
        open={shareOpen && isAuthenticated}
        onClose={() => setShareOpen(false)}
        teamId={shareTeamId}
        championTeamId={championTeamId}
        advancingThirdGroups={advancingThirdGroups}
        result={sharePathResult}
        placements={placements}
        knockoutWinners={knockoutWinners}
        thirdPlaceOption={thirdPlaceOption}
        funderAddress={funderAddress}
        kickback={kickback}
        availableChances={availableChances}
      />

      <CampaignRulesModal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />

      <PredictionRecordsModal
        open={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        records={records}
        isLoading={recordsLoading}
        isError={recordsError}
      />

      <LightRays className="absolute left-0 top-0 z-0 h-full w-full" />
    </div>
  );
}
