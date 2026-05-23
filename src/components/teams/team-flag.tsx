import { cn } from "@/lib/cn";
import { getFifaFlagIconCode } from "@/lib/teams/fifa-flag-icon";

interface TeamFlagProps {
  code?: string;
  name?: string;
  className?: string;
}

const defaultFlagClassName = "inline-block h-[23px] w-[23px] shrink-0";

export function TeamFlag({ code, name, className }: TeamFlagProps) {
  const flagIconCode = code ? getFifaFlagIconCode(code) : undefined;

  if (!flagIconCode) {
    return (
      <span
        className={cn(
          defaultFlagClassName,
          "grid place-items-center text-[10px] font-semibold text-prophet-muted",
          className
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
