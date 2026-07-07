import { ChevronDown } from "lucide-react";

import type { ComboLineOption } from "./types";

export type SpreadSelectorOption = string | ComboLineOption;

export type SpreadSelectorProps = {
  value: string;
  options?: SpreadSelectorOption[];
  onChange?: (spread: string) => void;
  ariaLabel?: string;
};

function normalizeSpreadSelectorOptions(
  options: SpreadSelectorOption[],
  value: string,
): ComboLineOption[] {
  if (options.length === 0) {
    return [{ value }];
  }

  return options.map((option) =>
    typeof option === "string" ? { value: option } : option,
  );
}

export function SpreadSelector({
  value,
  options = [value],
  onChange,
  ariaLabel = "Spread line",
}: SpreadSelectorProps) {
  const normalizedOptions = normalizeSpreadSelectorOptions(options, value);

  return (
    <label className="relative inline-flex h-[30px] w-16 shrink-0 items-center rounded-lg border border-prophet-line bg-prophet-panel px-2">
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full appearance-none bg-transparent pr-4 text-xs font-[500] leading-[15px] text-prophet-foreground outline-none disabled:text-prophet-muted"
        aria-label={ariaLabel}
      >
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.value}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 size-2.5 text-prophet-muted"
        aria-hidden
      />
    </label>
  );
}
