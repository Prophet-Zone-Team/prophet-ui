"use client";

import {
  createContext,
  memo,
  useContext,
  useState,
  type ReactNode
} from "react";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { formatGoalEventTime } from "@/lib/market/match-display";
import { resolveAxisSecondsFromMatchClock } from "@/lib/market/live-fixture-probability-chart";
import type { GameMatchChartEvent } from "@/types/market";

interface ChartCustomizedProps {
  offset?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  width?: number;
  height?: number;
  xAxisMap?: Record<
    string,
    {
      scale?: (value: number) => number;
    }
  >;
}

function resolveMarkerX(
  elapsedSeconds: number,
  xAxisMap: ChartCustomizedProps["xAxisMap"],
  offset: ChartCustomizedProps["offset"],
  width: number | undefined,
  maxAxisSeconds: number
): number {
  const axisSeconds = resolveAxisSecondsFromMatchClock(elapsedSeconds);
  const xAxis = xAxisMap ? Object.values(xAxisMap)[0] : undefined;

  if (xAxis?.scale) {
    const scaled = xAxis.scale(axisSeconds);

    if (Number.isFinite(scaled)) {
      return scaled;
    }
  }

  const left = offset?.left ?? 0;
  const right = offset?.right ?? 0;
  const plotWidth = (width ?? 0) - left - right;

  return left + (axisSeconds / maxAxisSeconds) * plotWidth;
}

function SoccerBallIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10.5" fill="#F5F5F5" stroke="#CFCFCF" />
      <path d="M12 4.5L14.8 8.2L12 11.9L9.2 8.2L12 4.5Z" fill="#4A4A4A" />
      <path d="M6.2 8.8L9.2 8.2L10.8 12.2L8.1 14.8L6.2 8.8Z" fill="#4A4A4A" />
      <path
        d="M17.8 8.8L15.9 14.8L13.2 12.2L14.8 8.2L17.8 8.8Z"
        fill="#4A4A4A"
      />
      <path
        d="M8.1 14.8L10.8 12.2H13.2L15.9 14.8L12 19.5L8.1 14.8Z"
        fill="#4A4A4A"
      />
    </svg>
  );
}

export interface GoalEventMarkerLayerProps extends ChartCustomizedProps {
  events: GameMatchChartEvent[];
  maxAxisSeconds: number;
  homeCode?: string;
  homeName?: string;
  awayCode?: string;
  awayName?: string;
}

type GoalEventMarkerChartConfig = Omit<
  GoalEventMarkerLayerProps,
  keyof ChartCustomizedProps
>;

const GoalEventMarkerChartContext =
  createContext<GoalEventMarkerChartConfig | null>(null);

export function GoalEventMarkerChartProvider({
  value,
  children
}: {
  value: GoalEventMarkerChartConfig;
  children: ReactNode;
}) {
  return (
    <GoalEventMarkerChartContext.Provider value={value}>
      {children}
    </GoalEventMarkerChartContext.Provider>
  );
}

/** Stable Recharts Customized component — do not pass an inline render function. */
export function GoalEventMarkerCustomized(chartProps: Record<string, unknown>) {
  const config = useContext(GoalEventMarkerChartContext);

  if (!config) {
    return null;
  }

  return (
    <GoalEventMarkerLayer
      offset={chartProps.offset as GoalEventMarkerLayerProps["offset"]}
      width={chartProps.width as number | undefined}
      height={chartProps.height as number | undefined}
      xAxisMap={chartProps.xAxisMap as GoalEventMarkerLayerProps["xAxisMap"]}
      {...config}
    />
  );
}

function areGoalEventsEqual(
  left: GameMatchChartEvent[],
  right: GameMatchChartEvent[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (event, index) =>
      event.elapsedSeconds === right[index]?.elapsedSeconds &&
      event.side === right[index]?.side &&
      event.type === right[index]?.type
  );
}

export const GoalEventMarkerLayer = memo(
  function GoalEventMarkerLayer({
    offset,
    width,
    height,
    xAxisMap,
    events,
    maxAxisSeconds,
    homeCode,
    homeName,
    awayCode,
    awayName
  }: GoalEventMarkerLayerProps) {
    const t = useTranslations("trade");
    const [hoveredEventKey, setHoveredEventKey] = useState<string | null>(null);

    if (!events.length || !height || !width || maxAxisSeconds <= 0) {
      return null;
    }

    const bottom = offset?.bottom ?? 0;
    const markerY = height - bottom + 6;

    return (
      <foreignObject
        x={0}
        y={0}
        width="100%"
        height="100%"
        className="overflow-visible"
      >
        <div className="relative h-full w-full">
          {events.map((event) => {
            const x = resolveMarkerX(
              event.elapsedSeconds,
              xAxisMap,
              offset,
              width,
              maxAxisSeconds
            );

            const eventKey = `${event.elapsedSeconds}-${event.side}`;
            const isHovered = hoveredEventKey === eventKey;
            const teamCode = event.side === "home" ? homeCode : awayCode;
            const teamName = event.side === "home" ? homeName : awayName;

            return (
              <div key={eventKey}>
                <button
                  type="button"
                  aria-label={t("chartGoalAria", {
                    time: formatGoalEventTime(event.elapsedSeconds)
                  })}
                  className="absolute z-10 flex size-6 -translate-x-1/2 items-center justify-center border-0 bg-transparent p-0"
                  style={{ left: x, top: markerY }}
                  onMouseEnter={() => setHoveredEventKey(eventKey)}
                  onMouseLeave={() => setHoveredEventKey(null)}
                  onFocus={() => setHoveredEventKey(eventKey)}
                  onBlur={() => setHoveredEventKey(null)}
                >
                  <span className="relative inline-flex size-5 items-center justify-center">
                    <SoccerBallIcon className="size-5" />
                    <TeamFlag
                      code={teamCode}
                      name={teamName ?? event.side}
                      className="absolute -right-1 -top-1 !h-3 !w-3 rounded-[2px] border border-white shadow-[0_0_2px_rgba(0,0,0,0.25)]"
                    />
                  </span>
                </button>

                {isHovered ? (
                  <div
                    className="absolute z-20 -translate-x-1/2"
                    style={{ left: x, top: markerY - 58 }}
                  >
                    <div className="relative rounded-[8px] border border-[#EBEBEB] bg-white px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
                      <p className="m-0 text-[12px] font-[400] leading-[17px] text-[#909090]">
                        {formatGoalEventTime(event.elapsedSeconds)}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <TeamFlag
                          code={teamCode}
                          name={teamName ?? event.side}
                          className="!h-4 !w-4 rounded-[2px]"
                        />
                        <span className="text-[12px] font-[500] leading-[17px] text-[#65AF14]">
                          {t("chartGoalLabel")}
                        </span>
                      </div>
                      <span
                        className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-white"
                        aria-hidden
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </foreignObject>
    );
  },
  (previous, next) => {
    return (
      previous.maxAxisSeconds === next.maxAxisSeconds &&
      previous.homeCode === next.homeCode &&
      previous.homeName === next.homeName &&
      previous.awayCode === next.awayCode &&
      previous.awayName === next.awayName &&
      Math.round(previous.width ?? 0) === Math.round(next.width ?? 0) &&
      Math.round(previous.height ?? 0) === Math.round(next.height ?? 0) &&
      areGoalEventsEqual(previous.events, next.events)
    );
  }
);
