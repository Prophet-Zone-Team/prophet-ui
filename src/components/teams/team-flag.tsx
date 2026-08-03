import type { ReactNode } from "react";

import { ProphetMarkIcon } from "@/components/icons/prophet-mark-icon";
import { findCuratedTeamByCode } from "@/data/teams/curated-team-list";
import teams from "@/data/teams";
import { cn } from "@/lib/cn";

interface TeamFlagProps {
  code?: string;
  name?: string;
  logoUrl?: string;
  className?: string;
  fallbackClassName?: string;
  /**
   * Whether to display the fallback icon, defaults to true.
   */
  fallback?: boolean;
}

const defaultFlagClassName =
  "inline-block h-[23px] w-[23px] shrink-0 overflow-hidden rounded-sm";

function isImageUrl(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

function FlagIcon({
  flagCode,
  label,
  className,
}: {
  flagCode: string;
  label: string;
  className?: string;
}) {
  const normalized = flagCode.trim().toLowerCase();

  return (
    <span
      className={cn("fi fis", `fi-${normalized}`, defaultFlagClassName, className)}
      role="img"
      aria-label={label}
    />
  );
}

function renderFlagAsset(
  flagCode: string,
  label: string,
  className?: string
): ReactNode {
  if (isImageUrl(flagCode)) {
    return (
      <img
        src={flagCode}
        alt={label}
        className={cn(defaultFlagClassName, "object-contain", className)}
      />
    );
  }

  return <FlagIcon flagCode={flagCode} label={label} className={className} />;
}

export function TeamFlag({
  code,
  name,
  logoUrl,
  className,
  fallback = true
}: TeamFlagProps) {
  const label = name ?? code ?? "Team flag";

  if (logoUrl) {
    return renderFlagAsset(logoUrl, label, className);
  }

  const curatedTeam = code ? findCuratedTeamByCode(code) : undefined;

  if (curatedTeam?.logoUrl) {
    return renderFlagAsset(curatedTeam.logoUrl, label, className);
  }

  const team = teams[name as keyof typeof teams];

  if (team?.logo) {
    return renderFlagAsset(team.logo, label, className);
  }

  if (!fallback) {
    return null;
  }

  return (
    <ProphetMarkIcon
      className={cn(defaultFlagClassName, className)}
      aria-label={label}
      role="img"
    />
  );
}
