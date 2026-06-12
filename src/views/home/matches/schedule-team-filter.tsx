"use client";

import Drawer, { DrawerDirection } from "@/components/drawer";
import { useDevice } from "@/hooks/common/use-device";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { ScheduleFilterTeam } from "@/lib/market/schedule-match";
import type { Team } from "@/types/market";
import { ScheduleFilterTriggerButton } from "@/views/home/matches/schedule-filter-trigger-button";

export interface ScheduleTeamFilterProps {
  teams: ScheduleFilterTeam[];
  selectedTeamIds: Team["id"][];
  onSelectedTeamIdsChange: (teamIds: Team["id"][]) => void;
}

export function ScheduleTeamFilter({
  teams,
  selectedTeamIds,
  onSelectedTeamIdsChange
}: ScheduleTeamFilterProps) {
  const t = useTranslations("home");
  const isMobile = useDevice();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTeams = useMemo(
    () =>
      selectedTeamIds
        .map((teamId) => teams.find((team) => team.id === teamId))
        .filter((team): team is ScheduleFilterTeam => team !== undefined),
    [selectedTeamIds, teams]
  );

  useEffect(() => {
    if (!open || isMobile) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile, open]);

  function toggleTeam(teamId: Team["id"]) {
    if (selectedTeamIds.includes(teamId)) {
      onSelectedTeamIdsChange(selectedTeamIds.filter((id) => id !== teamId));
      return;
    }

    onSelectedTeamIdsChange([...selectedTeamIds, teamId]);
  }

  function removeTeam(teamId: Team["id"]) {
    onSelectedTeamIdsChange(selectedTeamIds.filter((id) => id !== teamId));
  }

  if (teams.length === 0) {
    return null;
  }

  return (
    <div
      className="flex min-w-0 items-center gap-[14px]"
      role="group"
      aria-label={t("filterByTeam")}
    >
      <span className="hidden md:block shrink-0 text-[16px] font-[500] leading-[19px] text-[#909090]">
        {t("filter")}
      </span>

      <div ref={containerRef} className="relative shrink-0">
        <ScheduleFilterTriggerButton
          label={t("teams")}
          open={open}
          ariaHaspopup={isMobile ? "dialog" : "listbox"}
          onClick={() => setOpen((current) => !current)}
        />

        {!isMobile && open ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-[min(920px,calc(100vw-2rem))] rounded-xl border border-[#EBEBEB] bg-white p-4 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
            <ScheduleTeamFilterPanelContent
              teams={teams}
              selectedTeamIds={selectedTeamIds}
              onToggleTeam={toggleTeam}
            />
          </div>
        ) : null}
      </div>

      {isMobile ? (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title={t("teams")}
          direction={DrawerDirection.Bottom}
          className="!h-auto max-h-[70dvh]"
        >
          <div className="px-4 pb-6">
            <ScheduleTeamFilterPanelContent
              teams={teams}
              selectedTeamIds={selectedTeamIds}
              onToggleTeam={toggleTeam}
            />
          </div>
        </Drawer>
      ) : null}

      {selectedTeams.length > 0 ? (
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {selectedTeams.map((team) => (
            <ScheduleTeamFilterChip
              key={team.id}
              team={team}
              onRemove={() => removeTeam(team.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ScheduleTeamFilterChip({
  team,
  onRemove
}: {
  team: ScheduleFilterTeam;
  onRemove: () => void;
}) {
  const t = useTranslations("home");
  const displayName = useLocalizedTeamName(team.code, team.name);

  return (
    <span className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[20px] bg-[#EBEBEB] pl-[10px] pr-[14px]">
      <TeamFlag
        code={team.code}
        name={displayName}
        className="h-[16px] w-[16px] shrink-0 rounded-[2px] text-[16px]"
      />
      <span className="text-[16px] font-[400] leading-[19px] text-black">
        {team.code}
      </span>
      <button
        type="button"
        className="inline-flex size-4 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-black"
        aria-label={t("removeTeamFilter", { team: displayName })}
        onClick={onRemove}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="9"
          height="9"
          viewBox="0 0 9 9"
          fill="none"
        >
          <path d="M8.5 0.5L0.5 8.5" stroke="black" strokeLinecap="round" />
          <path d="M0.5 0.5L8.5 8.5" stroke="black" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}

function ScheduleTeamFilterPanelContent({
  teams,
  selectedTeamIds,
  onToggleTeam
}: {
  teams: (ScheduleFilterTeam & { logoUrl?: string })[];
  selectedTeamIds: Team["id"][];
  onToggleTeam: (teamId: Team["id"]) => void;
}) {
  const t = useTranslations("home");

  return (
    <div
      role="listbox"
      aria-label={t("selectTeams")}
      aria-multiselectable="true"
      className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {teams.map((team) => (
        <ScheduleTeamFilterOption
          key={team.id}
          team={team}
          selected={selectedTeamIds.includes(team.id)}
          onToggle={() => onToggleTeam(team.id)}
        />
      ))}
    </div>
  );
}

function ScheduleTeamFilterOption({
  team,
  selected,
  onToggle
}: {
  team: ScheduleFilterTeam & { logoUrl?: string };
  selected: boolean;
  onToggle: () => void;
}) {
  const displayName = useLocalizedTeamName(team.code, team.name);

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className="flex min-w-0 items-center gap-2.5 rounded-md border-0 bg-transparent p-1 text-left"
      onClick={onToggle}
    >
      <span
        className={cn(
          "inline-flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border border-[#CFCFCF]",
          selected ? "border-black bg-black" : "bg-white"
        )}
        aria-hidden
      >
        {selected ? (
          <Check className="size-3 text-white" strokeWidth={3} />
        ) : null}
      </span>
      <TeamFlag
        code={team.code}
        name={displayName}
        logoUrl={team.logoUrl}
        className="h-[26px] w-[26px] shrink-0 rounded text-[26px]"
      />
      <span className="truncate text-[14px] font-[500] leading-[17px] text-black">
        {displayName}
      </span>
      <span className="shrink-0 text-[14px] font-[500] leading-[17px] text-[#909090]">
        {team.code}
      </span>
    </button>
  );
}
