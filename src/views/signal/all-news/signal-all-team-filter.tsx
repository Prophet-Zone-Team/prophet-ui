"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import Drawer, { DrawerDirection } from "@/components/drawer";
import { TeamFlag } from "@/components/teams/team-flag";
import { useDevice } from "@/hooks/common/use-device";
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
  const t = useTranslations("signal");
  const isMobile = useDevice();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    value === "all"
      ? null
      : (options.find((option) => option.value === value) ?? null);

  const selectedLabel = selectedOption?.label ?? "All Teams";

  useEffect(() => {
    if (!open || isMobile) {
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
  }, [isMobile, open]);

  function handleSelect(nextValue: SignalAllTeamFilter) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex max-w-[140px] items-center gap-[6px] border-0 bg-transparent p-0 text-[14px] font-[400] leading-[17px] text-[#909090] md:max-w-[180px]",
          disabled && "cursor-not-allowed opacity-50"
        )}
        aria-expanded={open}
        aria-haspopup={isMobile ? "dialog" : "listbox"}
        aria-label={`Filter by team: ${selectedLabel}`}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        {selectedOption ? (
          <TeamFlag
            code={selectedOption.teamCode}
            name={selectedOption.label}
            className="h-[16px] w-[16px] shrink-0 rounded-[2px] text-[16px]"
          />
        ) : null}
        <span className="truncate">{selectedLabel}</span>
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
          aria-hidden
        >
          <path
            d="M9.7998 0.800781L5.40757 4.80078L0.799805 0.800781"
            stroke="#909090"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {!isMobile ? (
        <AnimatePresence>
          {open ? (
            <motion.div
              key="team-filter-dropdown"
              className="absolute right-0 top-full z-50 mt-2 max-h-[min(360px,60vh)] min-w-[220px] overflow-y-auto rounded-[8px] border border-[#EBEBEB] bg-white py-1 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
              role="listbox"
              aria-label="Select team"
              initial={{ opacity: 0, scaleY: 0.88, y: -6 }}
              animate={{ opacity: 1, scaleY: 1, y: 0 }}
              exit={{ opacity: 0, scaleY: 0.88, y: -6 }}
              transition={TEAM_FILTER_DROPDOWN_TRANSITION}
              style={{ transformOrigin: "top right" }}
            >
              <SignalAllTeamFilterPanelContent
                value={value}
                options={options}
                onSelect={handleSelect}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}

      {isMobile ? (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="Filter by team"
          direction={DrawerDirection.Bottom}
          className="!h-auto max-h-[70dvh]"
        >
          <div className="overflow-y-auto px-4 pb-6">
            <SignalAllTeamFilterPanelContent
              value={value}
              options={options}
              onSelect={handleSelect}
            />
          </div>
        </Drawer>
      ) : null}
    </div>
  );
}

function SignalAllTeamFilterPanelContent({
  value,
  options,
  onSelect
}: {
  value: SignalAllTeamFilter;
  options: SignalAllTeamOption[];
  onSelect: (value: SignalAllTeamFilter) => void;
}) {
  return (
    <>
      <SignalAllTeamFilterOption
        label="All Teams"
        selected={value === "all"}
        onSelect={() => onSelect("all")}
      />
      {options.map((option) => (
        <SignalAllTeamFilterOption
          key={option.value}
          label={option.label}
          teamCode={option.teamCode}
          selected={value === option.value}
          onSelect={() => onSelect(option.value)}
        />
      ))}
    </>
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
        "flex w-full items-center justify-between gap-3 border-0 bg-transparent px-3 py-2 text-[14px] font-[400] leading-[17px]",
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
      ) : (
        <span className="shrink-0" aria-hidden />
      )}
      <span className="min-w-0 flex-1 truncate text-right">{label}</span>
    </button>
  );
}
