"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { withdrawFieldLabelClass, withdrawSelectorBoxClass } from "@/views/portfolio/withdraw/withdraw-ui";

export interface FundingSelectorDropdownProps {
  label: string;
  triggerLabel: string;
  triggerIcon: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function FundingSelectorDropdown({
  label,
  triggerLabel,
  triggerIcon,
  open,
  onOpenChange,
  disabled = false,
  children,
  className,
}: FundingSelectorDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-2", className)}>
      <span className={withdrawFieldLabelClass}>{label}</span>
      <button
        type="button"
        className={cn(withdrawSelectorBoxClass, disabled && "cursor-not-allowed opacity-50")}
        onClick={() => {
          if (!disabled) {
            onOpenChange(!open);
          }
        }}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          {triggerIcon}
          <span className="text-base font-[556] text-black">{triggerLabel}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-[#909090] transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[220px] overflow-y-auto rounded-[6px] border border-[#EBEBEB] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
