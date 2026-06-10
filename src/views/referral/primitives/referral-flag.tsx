import { cn } from "@/lib/cn";
import type { ReferralFlagKind } from "@/types/referral";

import { emojiFlagClass, englandFlagClass } from "../referral-ui";

interface ReferralFlagProps {
  flag: string;
  flagKind?: ReferralFlagKind;
  className?: string;
  ariaLabel?: string;
}

export function ReferralFlag({ flag, flagKind, className, ariaLabel }: ReferralFlagProps) {
  if (flagKind === "england") {
    return (
      <span
        className={cn(englandFlagClass, className)}
        aria-label={ariaLabel ?? "England"}
      />
    );
  }

  return (
    <span
      className={cn(emojiFlagClass, className)}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
    >
      {flag}
    </span>
  );
}
