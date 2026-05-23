"use client";

import { motion } from "framer-motion";
import { useId } from "react";

import { cn } from "@/lib/cn";

const TAB_UNDERLINE_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85
};

export interface TabSwitcherItem {
  id: string;
  label: string;
}

export interface TabSwitcherProps {
  items: TabSwitcherItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: "default" | "compact";
  "aria-label"?: string;
}

const tabLabelSizeClass = {
  default: "text-[18px] leading-[21px]",
  compact: "text-base leading-[19px]"
} as const;

export function TabSwitcher({
  items,
  value,
  onChange,
  className,
  size = "default",
  "aria-label": ariaLabel
}: TabSwitcherProps) {
  const underlineLayoutId = `${useId()}-tab-underline`;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex h-9 items-start", "gap-6", className)}
    >
      {items.map((item) => {
        const isActive = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.id)}
            className="flex min-w-0 flex-col items-center border-0 bg-transparent p-0 cursor-pointer"
          >
            <span
              className={cn(
                "text-center text-black transition-opacity duration-200",
                tabLabelSizeClass[size],
                isActive ? "font-[556] opacity-100" : "font-[457] opacity-55"
              )}
            >
              {item.label}
            </span>
            {isActive ? (
              <motion.span
                layoutId={underlineLayoutId}
                aria-hidden="true"
                className="mt-auto block h-0 w-10 shrink-0 border-b-[3px] border-black"
                transition={TAB_UNDERLINE_TRANSITION}
              />
            ) : (
              <span
                aria-hidden="true"
                className="mt-auto block h-0 w-10 shrink-0 border-b-[3px] border-transparent"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
