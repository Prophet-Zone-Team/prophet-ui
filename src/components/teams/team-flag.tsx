import { cn } from "@/lib/cn";
import teams from "@/data/teams";

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

export function TeamFlag({
  code,
  name,
  logoUrl,
  className,
  fallbackClassName,
  fallback = true,
}: TeamFlagProps) {
  const label = name ?? code ?? "Team flag";

  if (logoUrl) {
    if (isImageUrl(logoUrl)) {
      return (
        <img
          src={logoUrl}
          alt={label}
          className={cn(defaultFlagClassName, "object-cover", className)}
        />
      );
    }

    return <FlagIcon flagCode={logoUrl} label={label} className={className} />;
  }

  const team = teams[name as keyof typeof teams];

  if (team?.logo) {
    if (isImageUrl(team.logo)) {
      return (
        <img
          src={team.logo}
          alt={label}
          className={cn(defaultFlagClassName, "object-cover", className)}
        />
      );
    }

    return <FlagIcon flagCode={team.logo} label={label} className={className} />;
  }

  if (!fallback) {
    return null;
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
