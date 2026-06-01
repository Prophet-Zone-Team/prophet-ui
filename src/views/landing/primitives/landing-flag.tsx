import type { LandingFlagKind } from "@/types/landing";

interface LandingFlagProps {
  flag: string;
  flagKind?: LandingFlagKind;
  className?: string;
  ariaLabel?: string;
}

export function LandingFlag({ flag, flagKind, className = "flag", ariaLabel }: LandingFlagProps) {
  if (flagKind === "england") {
    return <span className={`${className} england-flag`} aria-label={ariaLabel ?? "England"} />;
  }

  return (
    <span className={className} aria-hidden={ariaLabel ? undefined : true} aria-label={ariaLabel}>
      {flag}
    </span>
  );
}
