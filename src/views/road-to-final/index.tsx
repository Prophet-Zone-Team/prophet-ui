"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth/use-auth";
import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";

import { resolveThirdPlaceOption } from "./lib/bracket-resolver";
import { safeCalculatePath } from "./lib/calculate-path";
import { deriveBestThirdGroups, sortPlacementsBy } from "./lib/group-shortcuts";
import { getChampionTeamId } from "./lib/knockout-shortcuts";
import { getFifaRank, getSquadValue } from "./lib/team-strength";
import { createDefaultPlacements, getFinishForTeam } from "./lib/placements";
import { DEFAULT_THIRD_PLACE_GROUPS } from "./lib/path-config";
import {
  decodeUrlState,
  encodeUrlState,
  hydrateFromUrlPayload
} from "./lib/url-state";
import { isStepOneComplete } from "./lib/validation";
import { defaultSimulatorTeamId } from "./lib/teams";
import type { KnockoutMethodKey, SortMethodKey } from "./lib/method-keys";
import type { KnockoutWinners } from "./types";
import { KnockoutBracket } from "./knockout-bracket";
import { RoadToFinalPageShell } from "./page-shell";
import { RoadToFinalShareModal } from "./road-to-final-share-modal";
import { ShareFooter } from "./share-footer";
import dynamic from "next/dynamic";

const LightRays = dynamic(() => import("@/components/light-rays"), { ssr: false });

export function RoadToFinalPage({
  initialTeamId = defaultSimulatorTeamId
}: {
  initialTeamId?: string;
}) {
  const t = useTranslations("roadToFinal");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, isAuthenticated } = useAuth();
  const { content: referralContent } = useProphetReferral();
  const funderAddress = session?.funderAddress;
  const kickback = referralContent?.kickback;
  const safeInitialTeamId =
    getWorldCupTeamByIdOrCode(initialTeamId)?.id ?? defaultSimulatorTeamId;

  const [hydrated, setHydrated] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [placements, setPlacements] = useState(createDefaultPlacements);
  const [teamId, setTeamId] = useState(safeInitialTeamId);
  const [thirdGroups, setThirdGroups] = useState<string[]>([
    ...DEFAULT_THIRD_PLACE_GROUPS
  ]);
  const [knockoutWinners, setKnockoutWinners] = useState<KnockoutWinners>({});
  const [sortMethod, setSortMethod] = useState<SortMethodKey>("defaultOrder");
  const [knockoutMethod, setKnockoutMethod] =
    useState<KnockoutMethodKey>("manualSelection");
  const [groupErrorKey, setGroupErrorKey] = useState<string | null>(null);

  useEffect(() => {
    const encodedState = searchParams.get("state");

    if (encodedState) {
      const payload = decodeUrlState(encodedState);

      if (payload) {
        const hydratedState = hydrateFromUrlPayload(payload, safeInitialTeamId);

        setPlacements(hydratedState.placements ?? createDefaultPlacements());
        setThirdGroups(
          hydratedState.thirdGroups ?? [...DEFAULT_THIRD_PLACE_GROUPS]
        );
        setKnockoutWinners(hydratedState.knockoutWinners ?? {});

        if (hydratedState.teamId) {
          setTeamId(hydratedState.teamId);
        }

        if (hydratedState.sortMethod) {
          setSortMethod(hydratedState.sortMethod as SortMethodKey);
        }

        if (hydratedState.knockoutMethod) {
          setKnockoutMethod(hydratedState.knockoutMethod as KnockoutMethodKey);
        }
      }
    }

    setHydrated(true);
  }, [safeInitialTeamId, searchParams]);

  const advancingThirdGroups = useMemo(
    () => thirdGroups.slice().sort(),
    [thirdGroups]
  );
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
        knockoutMethod
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

  const groupError = groupErrorKey ? t(groupErrorKey) : null;

  return (
    <div className="relative mx-auto w-full">
      <RoadToFinalPageShell
        sortMethod={sortMethod}
        groupError={groupError}
        onRandomFill={() =>
          applyGroupSort("randomFill", () => Math.random() - 0.5)
        }
        onFifaFill={() =>
          applyGroupSort(
            "fifaRank",
            (a, b) => getFifaRank(a.id) - getFifaRank(b.id)
          )
        }
        onValueFill={() =>
          applyGroupSort(
            "squadValueRanking",
            (a, b) => getSquadValue(b.id) - getSquadValue(a.id)
          )
        }
        onClear={() => {
          setPlacements(createDefaultPlacements());
          setThirdGroups([...DEFAULT_THIRD_PLACE_GROUPS]);
          setSortMethod("defaultOrder");
          resetKnockout();
          setGroupErrorKey(null);
        }}
      />

      <div className="-mt-[12px] bg-[#0B1020]">
        <KnockoutBracket
          placements={placements}
          thirdPlaceOption={thirdPlaceOption}
          knockoutWinners={knockoutWinners}
          championTeamId={championTeamId}
          hasChampion={hasChampion}
          disabled={!stepOneComplete || !thirdPlaceOption}
          onKnockoutWinnersChange={(winners) => {
            setKnockoutWinners(winners);
            setKnockoutMethod("manualSelection");
          }}
        />

        <ShareFooter
          hasChampion={hasChampion}
          onShare={() => setShareOpen(true)}
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
      />

      <LightRays
        className="absolute z-0 w-full h-full left-0 top-0"
      />
    </div>
  );
}
