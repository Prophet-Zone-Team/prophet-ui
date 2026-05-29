import { cn } from "@/lib/cn";
import { getFifaFlagIconCode } from "@/lib/teams/fifa-flag-icon";

interface TeamFlagProps {
  code?: string;
  name?: string;
  logoUrl?: string;
  className?: string;
  noFlagIconCodeClassName?: string;
}

const defaultFlagClassName = "inline-block h-[23px] w-[23px] shrink-0";

export function TeamFlag({
  code,
  name,
  logoUrl,
  className,
  noFlagIconCodeClassName
}: TeamFlagProps) {
  const flagIconCode = code ? getFifaFlagIconCode(code) : undefined;

  if (logoUrl && !flagIconCode) {
    return (
      <img
        src={logoUrl}
        alt={name ?? code ?? "Team logo"}
        className={cn(defaultFlagClassName, "object-cover", className)}
      />
    );
  }

  if (!logoUrl && !flagIconCode) {
    return (
      <span
        className={cn(
          defaultFlagClassName,
          "grid place-items-center text-[10px] font-semibold text-prophet-muted",
          noFlagIconCodeClassName
        )}
        aria-label={name ?? "Unknown team"}
      >
        {code?.slice(0, 2) ?? "?"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "fi fis",
        `fi-${flagIconCode}`,
        defaultFlagClassName,
        className
      )}
      role="img"
      aria-label={name ?? code}
    />
  );
}
