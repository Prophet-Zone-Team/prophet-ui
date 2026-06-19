import { ChevronDown } from "lucide-react";

export type SpreadSelectorProps = {
  value: string;
  options?: string[];
  onChange?: (spread: string) => void;
};

export function SpreadSelector({
  value,
  options = [value],
  onChange
}: SpreadSelectorProps) {
  return (
    <label className="relative inline-flex h-[30px] w-16 shrink-0 items-center rounded-lg border border-[#EBEBEB] bg-white px-2">
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full appearance-none bg-transparent pr-4 text-xs font-[500] leading-[15px] text-black outline-none"
        aria-label="Spread line"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 size-2.5 text-[#909090]"
        aria-hidden
      />
    </label>
  );
}
