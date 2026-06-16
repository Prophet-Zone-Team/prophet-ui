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
  mobileLabel?: string;
  iconSrc?: string;
}

export interface TabSwitcherProps {
  items: TabSwitcherItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tabLabelClassName?: string;
  size?: "default" | "compact";
  "aria-label"?: string;
}

const tabLabelSizeClass = {
  default: "text-[16px] leading-[21px] font-[400] pb-[8px]",
  compact: "text-sm md:text-base leading-[19px] font-[300] pb-[4px]"
} as const;

const tabLabelActiveClass = {
  default: "font-[500]",
  compact: "font-[400]"
} as const;

export function TabSwitcher({
  items,
  value,
  onChange,
  className,
  tabLabelClassName,
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
                "flex items-center gap-1 text-center text-black transition-opacity duration-200",
                tabLabelSizeClass[size],
                isActive && tabLabelActiveClass[size],
                isActive ? "opacity-100" : "opacity-55",
                tabLabelClassName
              )}
            >
              {item.iconSrc ? (
                <img
                  src={item.iconSrc}
                  alt=""
                  aria-hidden="true"
                  className="size-5 shrink-0"
                />
              ) : null}
              {item.mobileLabel ? (
                <>
                  <span className="md:hidden">{item.mobileLabel}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </>
              ) : (
                item.label
              )}
            </span>
            {isActive ? (
              <motion.span
                layoutId={underlineLayoutId}
                aria-hidden="true"
                className="mt-auto block h-0 w-10 shrink-0 border-b-[3px] border-black rounded-[6px]"
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
