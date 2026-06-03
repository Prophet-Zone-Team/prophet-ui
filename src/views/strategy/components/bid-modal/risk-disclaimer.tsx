import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

import { STRATEGY_BID_RISK_DISCLAIMER } from "./constants";

export type RiskDisclaimerProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function RiskDisclaimer({
  checked,
  onCheckedChange,
  className
}: RiskDisclaimerProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3",
        className
      )}
    >
      <span className="relative mt-0.5 inline-flex size-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex size-4 items-center justify-center rounded border border-[#909090] bg-[#F5F5F5]",
            "peer-checked:border-[#65AF14] peer-checked:bg-[#65AF14]"
          )}
        >
          {checked ? (
            <Check className="size-3 text-white" strokeWidth={2.5} />
          ) : null}
        </span>
      </span>
      <span className="font-[Sora] text-sm font-light leading-[18px] text-[#909090]">
        {STRATEGY_BID_RISK_DISCLAIMER}
      </span>
    </label>
  );
}
