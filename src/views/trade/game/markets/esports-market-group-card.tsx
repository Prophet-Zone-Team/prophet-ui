"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { formatCompactVolume } from "@/lib/formatters/volume";
import { cn } from "@/lib/cn";
import { MoneyLineCard } from "@/views/trade/game/money-line/money-line-card";

function EsportsMarketCardHeader({
  title,
  volume,
  expanded,
  onToggle,
  actions,
}: {
  title: string;
  volume?: number;
  expanded: boolean;
  onToggle: () => void;
  actions?: ReactNode;
}) {
  const t = useTranslations("trade");
  const volumeLabel = formatCompactVolume(volume);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "flex min-h-[79px] cursor-pointer items-start justify-between gap-4 p-[16px] transition-colors md:items-center",
        !expanded && "hover:bg-prophet-hover",
      )}
    >
      <div className="min-w-0 shrink-0">
        <h3 className="m-0 text-[20px] font-[500] leading-6 text-prophet-foreground">
          {title}
        </h3>
        {volumeLabel ? (
          <p className="m-0 mt-[6px] text-[14px] font-[500] leading-[17px] text-[#909090]">
            {t("compactVolume", { value: volumeLabel })}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div
          className="flex shrink-0 flex-wrap items-center justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

function EsportsMarketLineRow({ lineSelector }: { lineSelector: ReactNode }) {
  return (
    <div
      className="flex border-t border-prophet-line p-3 md:p-[16px]"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="flex min-w-0 flex-1 items-center justify-center">
        {lineSelector}
      </div>
    </div>
  );
}

export function EsportsMarketGroupCard({
  title,
  volume,
  expanded,
  onToggle,
  actions,
  lineSelector,
  expandedContent,
}: {
  title: string;
  volume?: number;
  expanded: boolean;
  onToggle: () => void;
  actions: ReactNode;
  lineSelector?: ReactNode;
  expandedContent?: ReactNode;
}) {
  return (
    <MoneyLineCard
      expanded={expanded}
      header={
        <>
          <EsportsMarketCardHeader
            title={title}
            volume={volume}
            expanded={expanded}
            onToggle={onToggle}
            actions={actions}
          />
          {lineSelector ? (
            <EsportsMarketLineRow lineSelector={lineSelector} />
          ) : null}
        </>
      }
      expandedContent={expandedContent}
    />
  );
}
