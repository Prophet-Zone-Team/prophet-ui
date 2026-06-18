import { cn } from "@/lib/cn";

import type { ComboPickOutcomeSide } from "./types";

export type YesNoToggleProps = {
  value: ComboPickOutcomeSide;
  onChange?: (side: ComboPickOutcomeSide) => void;
};

export function YesNoToggle({ value, onChange }: YesNoToggleProps) {
  return (
    <div className="inline-flex h-[30px] w-16 shrink-0 items-center rounded-lg border border-[#EBEBEB] bg-white p-0.5">
      {(["yes", "no"] as const).map((side) => {
        const active = value === side;

        return (
          <button
            key={side}
            type="button"
            onClick={() => onChange?.(side)}
            className={cn(
              "flex h-[26px] flex-1 items-center justify-center rounded-md text-xs font-[500] leading-[15px] capitalize transition-colors",
              active ? "bg-black text-white" : "bg-transparent text-black"
            )}
          >
            {side}
          </button>
        );
      })}
    </div>
  );
}
