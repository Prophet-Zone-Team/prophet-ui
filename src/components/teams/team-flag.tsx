import { cn } from "@/lib/cn";
import teams from "@/data/teams";

interface TeamFlagProps {
  code?: string;
  name?: string;
  logoUrl?: string;
  className?: string;
  fallbackClassName?: string;
}

const defaultFlagClassName = "inline-block h-[23px] w-[23px] shrink-0";

export function TeamFlag({
  code,
  name,
  logoUrl,
  className,
  fallbackClassName
}: TeamFlagProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name ?? code ?? "Team logo"}
        className={cn(defaultFlagClassName, "object-cover", className)}
      />
    );
  }

  const team = teams[name as keyof typeof teams];

  if (team?.logo) {
    return (
      <img
        src={team.logo}
        alt={name ?? code ?? "Team logo"}
        className={cn(defaultFlagClassName, "object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        defaultFlagClassName,
        "grid place-items-center text-[10px] font-semibold text-prophet-muted",
        fallbackClassName
      )}
      aria-label={name ?? "Unknown team"}
    >
      {code?.slice(0, 2) ?? "?"}
    </span>
  );
}
