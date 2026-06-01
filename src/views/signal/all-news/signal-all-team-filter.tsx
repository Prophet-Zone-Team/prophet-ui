"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

import type { SignalAllTeamFilter, SignalAllTeamOption } from "./types";

const TEAM_FILTER_DROPDOWN_TRANSITION = {
  type: "spring" as const,
  stiffness: 480,
  damping: 34,
  mass: 0.85
};

export type SignalAllTeamFilterProps = {
  value: SignalAllTeamFilter;
  options: SignalAllTeamOption[];
  onChange: (value: SignalAllTeamFilter) => void;
  disabled?: boolean;
  className?: string;
};

export function SignalAllTeamFilterControl({
  value,
  options,
  onChange,
  disabled = false,
  className
}: SignalAllTeamFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    value === "all"
      ? "All Teams"
      : (options.find((option) => option.value === value)?.label ??
        "All Teams");

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-[6px] border-0 bg-transparent p-0 text-[14px] font-[457] leading-[17px] text-[#909090]",
          disabled && "cursor-not-allowed opacity-50"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Filter by team: ${selectedLabel}`}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span>{selectedLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="11"
          height="6"
          viewBox="0 0 11 6"
          fill="none"
          className={cn(
            "shrink-0 text-[#909090] transition-transform",
            open && "rotate-180"
          )}
        >
          <path
            d="M9.7998 0.800781L5.40757 4.80078L0.799805 0.800781"
            stroke="#909090"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="team-filter-dropdown"
            className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-[8px] border border-[#EBEBEB] bg-white py-1 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
            role="listbox"
            aria-label="Select team"
            initial={{ opacity: 0, scaleY: 0.88, y: -6 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.88, y: -6 }}
            transition={TEAM_FILTER_DROPDOWN_TRANSITION}
            style={{ transformOrigin: "top right" }}
          >
            <SignalAllTeamFilterOption
              label="All Teams"
              selected={value === "all"}
              onSelect={() => {
                onChange("all");
                setOpen(false);
              }}
            />
            {options.map((option) => (
              <SignalAllTeamFilterOption
                key={option.value}
                label={option.label}
                teamCode={option.teamCode}
                selected={value === option.value}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SignalAllTeamFilterOption({
  label,
  teamCode,
  selected,
  onSelect
}: {
  label: string;
  teamCode?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={cn(
        "flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2 text-left text-[14px] font-[457] leading-[17px]",
        selected ? "text-black" : "text-[#909090] hover:text-black"
      )}
      onClick={onSelect}
    >
      {teamCode ? (
        <TeamFlag
          code={teamCode}
          name={label}
          className="h-[18px] w-[18px] shrink-0 rounded-[2px] text-[18px]"
        />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}
