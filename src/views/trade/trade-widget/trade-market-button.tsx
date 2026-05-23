"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { tradeMarketButtonClass } from "@/views/trade/trade-widget/trade-ui";

export type TradeOrderMode = "market" | "limit";

const ORDER_MODE_OPTIONS: {
  id: TradeOrderMode;
  label: string;
  description: string;
}[] = [
  { id: "market", label: "Market", description: "Market order (FAK)" },
  { id: "limit", label: "Limit", description: "Limit order (GTC)" }
];

export interface TradeMarketButtonProps {
  value: TradeOrderMode;
  onChange: (value: TradeOrderMode) => void;
}

export function TradeMarketButton({ value, onChange }: TradeMarketButtonProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption =
    ORDER_MODE_OPTIONS.find((option) => option.id === value) ??
    ORDER_MODE_OPTIONS[0];

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  function selectOption(nextValue: TradeOrderMode) {
    onChange(nextValue);
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={selectedOption.description}
        className={cn(tradeMarketButtonClass, "cursor-pointer")}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selectedOption.label}</span>
        <svg
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M1 1L4 4L7 1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label="Order type"
          className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[120px] overflow-hidden rounded-md border border-prophet-line bg-white py-1 shadow-prophet"
        >
          {ORDER_MODE_OPTIONS.map((option) => {
            const isSelected = option.id === value;

            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                title={option.description}
                className={cn(
                  "block w-full px-3 py-1.5 text-left text-sm font-[556] leading-[17px] transition-colors",
                  isSelected
                    ? "bg-[#fafbfc] text-black"
                    : "text-prophet-muted hover:bg-[#fafbfc] hover:text-black"
                )}
                onClick={() => selectOption(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
