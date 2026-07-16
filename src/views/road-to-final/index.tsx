"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { useWinnerProbability } from "@/hooks/market/use-winner-probability";
import {
  hasPersistedRoadToFinalStorage,
  useRoadToFinalHydrated,
  useRoadToFinalStore,
} from "@/store/road-to-final-store";
import dynamic from "next/dynamic";

import { resolveThirdPlaceOption } from "./lib/bracket-resolver";
import {
  FIXED_GROUP_PLACEMENTS,
  FIXED_THIRD_PLACE_GROUPS
} from "./lib/fixed-group-stage";
import {
  applyKnockoutShortcut as runKnockoutShortcut,
  getChampionTeamId
} from "./lib/knockout-shortcuts";
import type { KnockoutPickMethod } from "./lib/team-strength";
import {
  decodeUrlState,
  hydrateFromUrlPayload,
} from "./lib/url-state";
import { replaceRoadToFinalUrlState } from "./lib/url-state-sync";
import { isStepOneComplete } from "./lib/validation";
import { getFixedKnockoutWinners } from "./lib/fixed-knockout";
import { defaultSimulatorTeamId } from "./lib/teams";
import type { KnockoutMethodKey } from "./lib/method-keys";
import type { KnockoutWinners } from "./types";
import { KnockoutBracket } from "./knockout-bracket";
import { RoadToFinalPageShell } from "./page-shell";

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
  const { probabilityByTeamId } = useWinnerProbability();

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

    const nextChampion = getChampionTeamId(nextWinners);

    if (nextChampion) {
      setTeamId(nextChampion);
    }
  };

  const handleKnockoutWinnersChange = (winners: KnockoutWinners) => {
    setKnockoutWinners(winners);
    setKnockoutMethod("manualSelection");
  };

  const handleClearKnockout = useCallback(() => {
    clearKnockoutSelections();

    if (urlHydrated) {
      replaceRoadToFinalUrlState(router, pathname, {
        teamId: defaultSimulatorTeamId,
        knockoutWinners: getFixedKnockoutWinners(),
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
        />
      </div>

      <LightRays className="absolute left-0 top-0 z-0 h-full w-full" />
    </div>
  );
}
