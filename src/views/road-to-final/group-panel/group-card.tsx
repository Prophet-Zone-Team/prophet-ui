"use client";

import { useTranslations } from "next-intl";

import {
  WORLD_CUP_2026_GROUPS,
  getWorldCupTeamByIdOrCode,
  type WorldCup2026Group,
  type WorldCup2026GroupTeam
} from "@/data/world-cup-2026/groups";
import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";

import {
  PLACEMENT_OPTIONS,
  type Placement,
  type PlacementOption
} from "../types";

const PLACEMENT_LABEL_KEYS = {
  first: "placementFirst",
  second: "placementSecond",
  third: "placementThird",
  fourth: "placementFourth"
} as const;

export function GroupCard({
  activeGroup,
  group,
  onPlacementChange,
  onSelectTeam,
  onToggleThirdGroup,
  placements,
  selectedTeamId,
  thirdGroupAdvances
}: {
  activeGroup: WorldCup2026Group;
  group: WorldCup2026Group;
  onPlacementChange: (placement: Placement, teamId: string) => void;
  onSelectTeam: (teamId: string) => void;
  onToggleThirdGroup: () => void;
  placements: Record<Placement, string>;
  selectedTeamId: string;
  thirdGroupAdvances: boolean;
}) {
  const t = useTranslations("roadToFinal");
  const groupTeams = WORLD_CUP_2026_GROUPS[group];
  const rows = PLACEMENT_OPTIONS.map((placement, index) => {
    const team =
      getWorldCupTeamByIdOrCode(placements[placement.key]) ?? groupTeams[index];

    return { placement, team };
  });

  return (
    <article
      className={cn(
        "rounded-[8px] border p-[12px]",
        group === activeGroup
          ? "border-[#18110F] bg-[#F9FAFC]"
          : "border-[#EBEBEB] bg-white"
      )}
    >
      <h3 className="m-0 text-[14px] font-[400] text-black">
        {t("groupLabel", { group })}
      </h3>
      <div className="mt-[10px] flex flex-col gap-[8px]">
        {rows.map(({ placement, team }) => (
          <PlacementRow
            key={placement.key}
            group={group}
            placement={placement}
            team={team}
            teams={groupTeams}
            selectedTeamId={selectedTeamId}
            thirdGroupAdvances={thirdGroupAdvances}
            onPlacementChange={onPlacementChange}
            onSelectTeam={onSelectTeam}
            onToggleThirdGroup={onToggleThirdGroup}
          />
        ))}
      </div>
    </article>
  );
}

function PlacementRow({
  group,
  placement,
  team,
  teams,
  selectedTeamId,
  thirdGroupAdvances,
  onPlacementChange,
  onSelectTeam,
  onToggleThirdGroup
}: {
  group: WorldCup2026Group;
  placement: PlacementOption;
  team?: WorldCup2026GroupTeam;
  teams: WorldCup2026GroupTeam[];
  selectedTeamId: string;
  thirdGroupAdvances: boolean;
  onPlacementChange: (placement: Placement, teamId: string) => void;
  onSelectTeam: (teamId: string) => void;
  onToggleThirdGroup: () => void;
}) {
  const t = useTranslations("roadToFinal");
  const placementLabel = t(PLACEMENT_LABEL_KEYS[placement.key]);
  const teamDisplayName = useLocalizedTeamName(
    team?.code ?? "",
    team?.name ?? t("pending")
  );

  return (
    <label
      className={cn(
        "flex items-center gap-[8px] rounded-[6px] p-[4px]",
        team?.id === selectedTeamId && "bg-[#F3F4F6]"
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-[6px] border-0 bg-transparent p-0 text-left"
        onClick={() => {
          if (team) {
            onSelectTeam(team.id);
          }
        }}
      >
        {team ? (
          <TeamFlag
            code={team.code}
            name={team.name}
            className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px]"
          />
        ) : null}
        <span className="truncate text-[12px] text-black">
          {team ? teamDisplayName : t("pending")}
        </span>
      </button>
      <select
        value={team?.id ?? ""}
        onChange={(event) => onPlacementChange(placement.key, event.target.value)}
        className="h-[26px] max-w-[100px] shrink-0 rounded-[4px] border border-[#EBEBEB] bg-white px-[4px] text-[11px]"
        aria-label={`${group} ${placementLabel}`}
      >
        {teams.map((optionTeam) => (
          <TeamOption key={optionTeam.id} team={optionTeam} />
        ))}
      </select>
      {placement.key === "third" ? (
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-[4px] border px-[6px] py-[2px] text-[10px]",
            thirdGroupAdvances
              ? "border-[#18110F] bg-[#18110F] text-white"
              : "border-[#EBEBEB] bg-white text-[#909090]"
          )}
          onClick={onToggleThirdGroup}
        >
          {thirdGroupAdvances ? t("advancingShort") : t("outShort")}
        </button>
      ) : (
        <small className="w-[24px] shrink-0 text-[10px] text-[#909090]">
          {placementLabel}
        </small>
      )}
    </label>
  );
}

function TeamOption({
  team
}: {
  team: { id: string; code: string; name: string };
}) {
  const displayName = useLocalizedTeamName(team.code, team.name);

  return <option value={team.id}>{displayName}</option>;
}
