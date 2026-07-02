"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref
} from "react";

import { cn } from "@/lib/cn";

export type MarketOtherSourceItem = {
  sourceName: string;
  netPercent: number;
};

const PILL_GAP_PX = 8;

function OtherSourcePill({
  sourceName,
  netPercentLabel,
  className
}: {
  sourceName: string;
  netPercentLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-[30px] min-w-[71px] shrink-0 items-center justify-between gap-2 rounded-[15px] border border-prophet-line bg-prophet-panel px-3",
        className
      )}
    >
      <span className="truncate text-[12px] font-[400] leading-[15px] text-[#909090]">
        {sourceName}
      </span>
      <span className="shrink-0 text-[12px] font-[400] leading-[15px] text-prophet-foreground">
        {netPercentLabel}
      </span>
    </div>
  );
}

function MorePill({
  label,
  expanded,
  onClick,
  className,
  measureRef
}: {
  label: string;
  expanded: boolean;
  onClick: () => void;
  className?: string;
  measureRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={measureRef}
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-[30px] shrink-0 items-center gap-1 rounded-[15px] border border-[#EBEBEB] bg-white px-3 text-[12px] font-[400] leading-[15px] text-[#909090]",
        className
      )}
      aria-expanded={expanded}
    >
      <span>{label}</span>
      <ChevronRight
        className={cn(
          "size-3 text-[#909090] transition-transform",
          expanded && "rotate-90"
        )}
        aria-hidden
      />
    </button>
  );
}

function calculateVisibleCount(
  containerWidth: number,
  pillWidths: number[],
  moreWidth: number,
  gap: number
): number {
  const total = pillWidths.length;

  if (total === 0 || containerWidth <= 0) {
    return 0;
  }

  let used = 0;

  for (let index = 0; index < total; index += 1) {
    const pillWidth = pillWidths[index] ?? 0;
    const nextUsed = used + (index > 0 ? gap : 0) + pillWidth;
    const remaining = index < total - 1;
    const requiredWidth = remaining ? nextUsed + gap + moreWidth : nextUsed;

    if (requiredWidth > containerWidth) {
      return Math.max(0, index);
    }

    used = nextUsed;
  }

  return total;
}

export function MarketOtherSources({
  sources,
  className
}: {
  sources: MarketOtherSourceItem[];
  className?: string;
}) {
  const t = useTranslations("trade");
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(sources.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const measurePillsRef = useRef<HTMLDivElement>(null);
  const measureMoreRef = useRef<HTMLButtonElement>(null);

  const labeledSources = useMemo(
    () =>
      sources.map((source) => ({
        ...source,
        netPercentLabel: t("netPercent", {
          value: source.netPercent.toFixed(1)
        })
      })),
    [sources, t]
  );

  useEffect(() => {
    setExpanded(false);
  }, [sources]);

  useLayoutEffect(() => {
    if (expanded) {
      return;
    }

    const container = containerRef.current;
    const measurePills = measurePillsRef.current;
    const measureMore = measureMoreRef.current;

    if (!container || !measurePills || !measureMore) {
      return;
    }

    const measure = () => {
      const pillWidths = Array.from(measurePills.children).map(
        (child) => (child as HTMLElement).offsetWidth
      );
      const moreWidth = measureMore.offsetWidth;
      const nextVisibleCount = calculateVisibleCount(
        container.clientWidth,
        pillWidths,
        moreWidth,
        PILL_GAP_PX
      );

      setVisibleCount(nextVisibleCount);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
  }, [expanded, labeledSources]);

  if (!sources.length) {
    return null;
  }

  const hasHidden = visibleCount < sources.length;
  const collapsedSources = labeledSources.slice(0, visibleCount);

  return (
    <section
      className={cn(
        "flex min-h-[30px] items-start gap-3 md:items-center",
        className
      )}
    >
      <h4 className="m-0 shrink-0 pt-[6px] text-[14px] font-[400] leading-[18px] text-[#909090] md:pt-0">
        {t("otherSources")}
      </h4>

      <div className="relative min-w-0 flex-1">
        <div
          className="pointer-events-none invisible absolute left-0 top-0 flex max-w-full gap-2"
          aria-hidden
        >
          <div ref={measurePillsRef} className="flex gap-2">
            {labeledSources.map((source) => (
              <OtherSourcePill
                key={source.sourceName}
                sourceName={source.sourceName}
                netPercentLabel={source.netPercentLabel}
              />
            ))}
          </div>
          <MorePill
            measureRef={measureMoreRef}
            label={t("otherSourcesMore")}
            expanded={false}
            onClick={() => undefined}
          />
        </div>

        <div
          ref={containerRef}
          className={cn(
            "flex gap-2",
            expanded ? "flex-wrap" : "flex-nowrap overflow-hidden"
          )}
        >
          {(expanded ? labeledSources : collapsedSources).map((source) => (
            <OtherSourcePill
              key={source.sourceName}
              sourceName={source.sourceName}
              netPercentLabel={source.netPercentLabel}
            />
          ))}

          {hasHidden ? (
            <MorePill
              label={t("otherSourcesMore")}
              expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
