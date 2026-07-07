"use client";

import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Popover } from "@/components/popover";
import { formatCompactVolume } from "@/lib/formatters/volume";
import { cn } from "@/lib/cn";

import type { MoneyLineCardId } from "./types";

const HELP_KEY_BY_CARD: Record<MoneyLineCardId, string> = {
  team_to_advance: "teamToAdvanceHelp",
  moneyline: "moneylineHelp",
  extra_time: "extraTimeHelp",
  penalty_shootout: "penaltyShootoutHelp"
};

function MoneyLineHelpTooltip({ message }: { message: string }) {
  return (
    <div className="max-w-[280px] rounded-lg border border-prophet-line bg-prophet-panel px-3 py-2 text-sm font-[400] leading-[18px] text-prophet-foreground shadow-prophet">
      {message}
    </div>
  );
}

export function CollapsedHeader({
  title,
  volume,
  actions,
  expanded,
  onToggle,
  cardId
}: {
  title: string;
  volume?: number;
  actions: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  cardId: MoneyLineCardId;
}) {
  const t = useTranslations("trade");
  const volumeLabel = formatCompactVolume(volume);
  const helpText = t(HELP_KEY_BY_CARD[cardId]);

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
        "flex min-h-[79px] cursor-pointer flex-col gap-3 bg-prophet-panel p-3 transition-colors md:flex-row md:items-center md:justify-between md:gap-4 md:p-4",
        !expanded && "hover:bg-prophet-hover"
      )}
    >
      <div className="min-w-0 shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="m-0 text-[16px] font-[500] capitalize leading-5 text-prophet-foreground">
            {title}
          </h3>
          <div
            className="inline-flex shrink-0"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Popover
              trigger="Hover"
              placement="Top"
              offset={8}
              triggerContainerClassName="inline-flex items-center justify-center"
              contentStyle={{ pointerEvents: "none" }}
              closeDelayDuration={0}
              content={<MoneyLineHelpTooltip message={helpText} />}
            >
              <button
                type="button"
                className="inline-flex items-center justify-center border-0 bg-transparent p-0"
                aria-label={helpText}
              >
                <CircleHelp className="size-[14px] text-prophet-muted" />
              </button>
            </Popover>
          </div>
        </div>
        {volumeLabel ? (
          <p className="m-0 mt-1 text-[14px] font-[400] leading-[18px] text-prophet-muted">
            {t("compactVolume", { value: volumeLabel })}
          </p>
        ) : null}
      </div>

      <div
        className="flex shrink-0 flex-wrap items-center justify-start gap-2 md:justify-end"
        onClick={(event) => event.stopPropagation()}
      >
        {actions}
      </div>
    </div>
  );
}
