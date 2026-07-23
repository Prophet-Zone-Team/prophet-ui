"use client";

import { useMemo } from "react";

import { cn } from "@/lib/cn";

export interface HomeSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
}

export function HomeSearchInput({
  value,
  onChange,
  placeholder = "Search",
  ariaLabel,
  className,
  inputClassName,
  maxLength
}: HomeSearchInputProps) {
  const hasValue = useMemo(
    () => value.trim().length > 0,
    [value]
  );

  return (
    <div
      className={cn(
        "relative flex h-[34px] w-full max-w-[230px] items-center gap-3 rounded-[18px] border border-prophet-line bg-prophet-panel px-3",
        className
      )}
    >
      <img
        src="/icons/icon-search.svg"
        alt=""
        className="h-3.5 w-3.5 shrink-0 object-contain object-center"
        aria-hidden
      />
      <input
        type="search"
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "h-full flex-1 border-0 bg-transparent pr-4 text-[14px] text-prophet-foreground outline-none placeholder:text-prophet-muted",
          inputClassName
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hasValue ? (
        <button
          type="button"
          className="absolute right-3 z-[1] flex size-3.5 items-center justify-center overflow-hidden rounded-full bg-prophet-line duration-150 hover:bg-prophet-hover"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <img
            src="/icons/icon-close.svg"
            alt=""
            className="h-1.5 w-1.5 shrink-0 object-contain object-center"
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}
