"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { ScheduleFilterTeam } from "@/lib/market/schedule-match";
import type { Team } from "@/types/market";

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
    if (!open) {
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
  }, [open]);

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
      aria-label="Filter by team"
    >
      <span className="shrink-0 text-[16px] font-[556] leading-[19px] text-[#909090]">
        Filter
      </span>

      <div ref={containerRef} className="relative shrink-0">
        <button
          type="button"
          className="inline-flex h-[34px] justify-center items-center w-[98px] rounded-[20px] gap-[10px] border border-[#909090] bg-white font-normal leading-[19px] text-black"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((current) => !current)}
        >
          Teams
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            className={cn("transition-transform", open && "rotate-180")}
          >
            <path
              d="M0.5 0.5L4.89223 4.5L9.5 0.5"
              stroke="black"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {open ? (
          <ScheduleTeamFilterPanel
            teams={teams}
            selectedTeamIds={selectedTeamIds}
            onToggleTeam={toggleTeam}
          />
        ) : null}
      </div>

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
  return (
    <span className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[20px] bg-[#EBEBEB] pl-[10px] pr-[14px]">
      <TeamFlag
        code={team.code}
        name={team.name}
        className="h-[16px] w-[16px] shrink-0 rounded-[2px] text-[16px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <span className="text-[16px] font-[457] leading-[19px] text-black">
        {team.code}
      </span>
      <button
        type="button"
        className="inline-flex size-4 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-black"
        aria-label={`Remove ${team.name} filter`}
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

function ScheduleTeamFilterPanel({
  teams,
  selectedTeamIds,
  onToggleTeam
}: {
  teams: ScheduleFilterTeam[];
  selectedTeamIds: Team["id"][];
  onToggleTeam: (teamId: Team["id"]) => void;
}) {
  return (
    <div
      className="absolute left-0 top-full z-50 mt-2 w-[min(920px,calc(100vw-2rem))] rounded-xl border border-[#EBEBEB] bg-white p-4 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
      role="listbox"
      aria-label="Select teams"
      aria-multiselectable="true"
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const selected = selectedTeamIds.includes(team.id);

          return (
            <button
              key={team.id}
              type="button"
              role="option"
              aria-selected={selected}
              className="flex min-w-0 items-center gap-2.5 rounded-md border-0 bg-transparent p-1 text-left"
              onClick={() => onToggleTeam(team.id)}
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
                name={team.name}
                className="h-[26px] w-[26px] shrink-0 rounded text-[26px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
              />
              <span className="truncate text-[14px] font-[556] leading-[17px] text-black">
                {team.name}
              </span>
              <span className="shrink-0 text-[14px] font-[556] leading-[17px] text-[#909090]">
                {team.code}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
