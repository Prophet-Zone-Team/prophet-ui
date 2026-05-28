import { cn } from "@/lib/cn";

export type RankingFilterOption = {
  value: string;
  label: string;
};

export type RankingFilterPillProps = {
  prefix: string;
  value: string;
  options: RankingFilterOption[];
  onChange: (value: string) => void;
  className?: string;
};

export function RankingFilterPill({
  prefix,
  value,
  options,
  onChange,
  className
}: RankingFilterPillProps) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  return (
    <label
      className={cn(
        "relative inline-flex h-[34px] max-w-full cursor-pointer items-center text-[14px] font-[457] md:text-[16px]",
        "rounded-[20px] border border-[#909090] px-3 gap-3 md:px-[12px] md:gap-[18px]",
        className
      )}
    >
      <span className="pointer-events-none leading-[19px] text-black">
        {prefix}: {selectedLabel}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`${prefix} filter`}
        className={cn(
          "absolute inset-0 h-full w-full cursor-pointer opacity-0",
          "appearance-none"
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
      >
        <path
          d="M0.5 0.5L4.89223 4.5L9.5 0.5"
          stroke="black"
          strokeLinecap="round"
        />
      </svg>
    </label>
  );
}
