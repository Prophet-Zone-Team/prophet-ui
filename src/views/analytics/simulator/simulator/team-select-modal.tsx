"use client";

import { TeamFlag } from "@/components/teams/team-flag";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

import type { SimulatorTeam } from "./types";

export type TeamSelectModalProps = {
  open: boolean;
  onClose: () => void;
  teams: SimulatorTeam[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
};

export function TeamSelectModal({
  open,
  onClose,
  teams,
  selectedTeamId,
  onSelectTeam
}: TeamSelectModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Select team for simulator"
      className="w-full max-w-[360px]"
    >
      <div
        className={cn(
          "box-border rounded-[12px] border border-[#EBEBEB] bg-white",
          "px-0 pb-[12px] pt-[20px]"
        )}
      >
        <h2 className="m-0 px-[20px] text-[18px] font-[400] leading-[21px] text-black">
          Select Team
        </h2>
        <p className="m-0 mt-[6px] px-[20px] text-[14px] font-[300] leading-[17px] text-[#909090]">
          Choose a team to preview knockout path context
        </p>
        <ul
          className="m-0 mt-[12px] max-h-[min(50vh,400px)] list-none overflow-y-auto p-0"
          role="listbox"
          aria-label="Teams"
        >
          {teams.map((team) => {
            const isSelected = team.id === selectedTeamId;

            return (
              <li key={team.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full items-center gap-[10px] border-0 px-[20px] py-[10px] text-left",
                    "bg-transparent transition-colors hover:bg-[#F9FAFC]",
                    isSelected && "bg-[#F9FAFC]"
                  )}
                  onClick={() => {
                    onSelectTeam(team.id);
                    onClose();
                  }}
                >
                  <TeamFlag
                    code={team.teamCode}
                    name={team.teamName}
                    className="h-[28px] w-[28px] shrink-0 rounded-[6px] text-[28px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                  />
                  <span className="min-w-0 flex-1 truncate text-[16px] font-[400] leading-[19px] text-black">
                    {team.teamName}
                  </span>
                  {isSelected ? (
                    <span className="shrink-0 text-[12px] font-[300] leading-[14px] text-[#909090]">
                      Selected
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
