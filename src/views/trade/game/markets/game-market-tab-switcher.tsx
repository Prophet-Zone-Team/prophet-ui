"use client";

import Drawer, { DrawerDirection } from "@/components/drawer";
import {
  TabSwitcher,
  type TabSwitcherItem
} from "@/components/ui/tab-switcher";
import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useState } from "react";

export interface GameMarketTabSwitcherProps {
  items: TabSwitcherItem[];
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
}

export function GameMarketTabSwitcher({
  items,
  value,
  onChange,
  "aria-label": ariaLabel
}: GameMarketTabSwitcherProps) {
  const isMobile = useDevice();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentTab = useMemo(
    () => items.find((item) => item.id === value),
    [items, value]
  );

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  if (!isMobile) {
    return (
      <TabSwitcher
        items={items}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex h-[34px] min-w-[98px] max-w-full items-center justify-center gap-[10px] rounded-[20px] border border-[#909090] bg-white px-3 font-normal leading-[19px] text-black"
        aria-expanded={drawerOpen}
        aria-haspopup="dialog"
        onClick={() => setDrawerOpen((current) => !current)}
      >
        <span className="truncate">{currentTab?.label ?? value}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={cn(
            "shrink-0 transition-transform",
            drawerOpen && "rotate-180"
          )}
          aria-hidden
        >
          <path
            d="M0.5 0.5L4.89223 4.5L9.5 0.5"
            stroke="black"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Market categories"
        direction={DrawerDirection.Bottom}
        className="!h-auto max-h-[70dvh]"
      >
        <div
          role="tablist"
          aria-label={ariaLabel}
          className="flex flex-col gap-2 px-4 pb-6"
        >
          {items.map((item) => {
            const isActive = item.id === value;

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-[20px] border border-[#909090] px-4 text-[16px] font-[400] leading-[19px] transition-colors",
                  isActive ? "bg-black text-white" : "bg-white text-black"
                )}
                onClick={() => {
                  onChange(item.id);
                  setDrawerOpen(false);
                }}
              >
                {item.iconSrc ? (
                  <img
                    src={item.iconSrc}
                    alt=""
                    aria-hidden="true"
                    className="size-5 shrink-0"
                  />
                ) : null}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </Drawer>
    </>
  );
}
