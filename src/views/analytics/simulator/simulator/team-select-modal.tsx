"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
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

function TeamSelectOption({
  team,
  isSelected,
  onSelect
}: {
  team: SimulatorTeam;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("analytics");
  const teamDisplayName = useLocalizedTeamName(team.teamCode, team.teamName);

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
        onClick={onSelect}
      >
        <TeamFlag
          code={team.teamCode}
          name={team.teamName}
          logoUrl={team.logoUrl}
          className="h-[28px] w-[28px] shrink-0 rounded-[6px] text-[28px]"
        />
        <span className="min-w-0 flex-1 truncate text-[16px] font-[500] leading-[19px] text-black">
          {teamDisplayName}
        </span>
        {isSelected ? (
          <span className="shrink-0 text-[12px] font-[400] leading-[14px] text-[#909090]">
            {t("selected")}
          </span>
        ) : null}
      </button>
    </li>
  );
}

export function TeamSelectModal({
  open,
  onClose,
  teams,
  selectedTeamId,
  onSelectTeam
}: TeamSelectModalProps) {
  const t = useTranslations("analytics");

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("selectTeamForSimulator")}
      className="w-full max-w-[360px]"
    >
      <div
        className={cn(
          "box-border rounded-[12px] border border-[#EBEBEB] bg-white",
          "px-0 pb-[12px] pt-[20px]"
        )}
      >
        <h2 className="m-0 px-[20px] text-[18px] font-[500] leading-[21px] text-black">
          {t("selectTeam")}
        </h2>
        <p className="m-0 mt-[6px] px-[20px] text-[14px] font-[400] leading-[17px] text-[#909090]">
          {t("chooseTeamPreviewPath")}
        </p>
        <ul
          className="m-0 mt-[12px] max-h-[min(50vh,400px)] list-none overflow-y-auto p-0"
          role="listbox"
          aria-label={t("teamsListAria")}
        >
          {teams.map((team) => (
            <TeamSelectOption
              key={team.id}
              team={team}
              isSelected={team.id === selectedTeamId}
              onSelect={() => {
                onSelectTeam(team.id);
                onClose();
              }}
            />
          ))}
        </ul>
      </div>
    </Modal>
  );
}
