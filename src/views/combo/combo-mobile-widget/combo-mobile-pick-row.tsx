import { TeamFlag } from "@/components/teams/team-flag";

import { RemovePickButton } from "@/views/combo/combo-widget/remove-pick-button";
import type { ComboPick } from "@/views/combo/combo-widget/types";

export type ComboMobilePickRowProps = {
  pick: ComboPick;
  onRemove?: () => void;
};

export function ComboMobilePickRow({ pick, onRemove }: ComboMobilePickRowProps) {
  return (
    <div className="flex h-[46px] items-center gap-2 rounded-xl bg-white/50 px-2.5">
      <TeamFlag
        code={pick.team.code}
        name={pick.team.name}
        logoUrl={pick.team.logoUrl}
        className="size-[25px] shrink-0 rounded-[2px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />

      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[10px] font-[400] leading-[13px] text-[#909090]">
          {pick.matchupLabel}
        </p>
        <p className="m-0 truncate text-sm font-[500] leading-[18px] text-black">
          {pick.selectionLabel}
        </p>
      </div>

      <RemovePickButton
        onClick={onRemove}
        label={`Remove ${pick.selectionLabel}`}
      />
    </div>
  );
}
