"use client";

/**
 * Imperative match event notifications.
 *
 * This module exposes a small TypeScript command-style API that renders an
 * `EventNotification` overlay into `document.body` using React Portals.
 *
 * Purpose
 * - Provide a simple, programmatic way to show match event cards (goal/foul/etc.)
 *   without requiring callers to place `EventNotification` into their JSX tree.
 * - Always renders into the top-level `body` to avoid layout clipping.
 *
 * Prerequisites
 * - The exported imperative functions must be called from the client runtime
 *   (e.g. inside event handlers, effects, or other "use client" modules).
 * - When called during SSR / server rendering, the functions safely no-op.
 *
 * Replace behavior (single active notification)
 * - Multiple rapid calls replace the currently displayed notification.
 * - Only the latest call is visible at any time.
 *
 * Auto dismiss
 * - Default `duration` is 4000ms.
 * - Pass `duration: 0` to disable auto-dismiss (the notification stays until dismissed).
 *
 * Return value
 * - `showEventNotification(...)` returns a dismiss function that can be called
 *   to close the currently active notification early.
 *
 * Example
 * ```ts
 * import {
 *   showEventNotification,
 *   EventNotificationLevel,
 *   type ShowEventNotificationOptions,
 * } from "@/components/notification/event";
 *
 * const options: ShowEventNotificationOptions = {
 *   level: EventNotificationLevel.Goal,
 *   teams: [
 *     { code: "ARG", name: "Argentina", event: "goal", score: "1" },
 *     { code: "FRA", name: "France", event: "goal", score: "0" },
 *   ],
 *   duration: 4000,
 * };
 *
 * const dismiss = showEventNotification(options);
 * // dismiss(); // closes early
 * ```
 */

import { cn } from "@/lib/cn";
import { TeamFlag } from "../teams/team-flag";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";

export function EventNotification(props: EventNotificationProps) {
  const { level, teams, className } = props;

  const isNewLevel = level === EventNotificationLevel.New;

  const levelInfo = EventNotificationLevelMap[level];

  if (!levelInfo || !teams.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative w-[352px] rounded-xl bg-white border flex items-center gap-2 font-[Sora] text-base font-[500] text-black",
        isNewLevel ? "h-[90px] px-[25px]" : "h-[108px] justify-center pt-[14px]",
        className,
      )}
      style={{
        borderColor: levelInfo.color,
        boxShadow: `0px 0px 10px 0px ${levelInfo.color}`,
      }}
    >
      <EventBadge level={level} />
      {
        isNewLevel ? (
          <>
            <TeamFlag
              code={teams[0].code}
              name={teams[0].name}
              className="size-[36px] min-w-[36px] shrink-0 !block rounded-md"
            />
            <div className="">{teams[0].event}</div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <TeamFlag
                  code={teams[0].code}
                  name={teams[0].name}
                  className="size-[36px] min-w-[36px] shrink-0 !block rounded-md"
                />
                <IconFoul level={level} event={teams[0].event} />
              </div>
              <div className="">{teams[0].name}</div>
            </div>
            <div className="flex items-center justify-center gap-[2px] text-[26px]">
              <div
                className="size-[36px] rounded-xl flex justify-center items-center"
                style={{
                  backgroundColor: teams[0].event?.toLowerCase?.() === "goal" ? "#7BCA25" : "white",
                }}
              >
                {teams[0].score}
              </div>
              <div className="">-</div>
              <div
                className="size-[36px] rounded-xl flex justify-center items-center"
                style={{
                  backgroundColor: teams[1].event?.toLowerCase?.() === "goal" ? "#7BCA25" : "white",
                }}
              >
                {teams[1].score}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <TeamFlag
                  code={teams[1].code}
                  name={teams[1].name}
                  className="size-[36px] min-w-[36px] shrink-0 !block rounded-md"
                />
                <IconFoul level={level} event={teams[1].event} />
              </div>
              <div className="">{teams[1].name}</div>
            </div>
          </>
        )
      }
    </div>
  );
}

export default EventNotification;

export interface EventNotificationTeam {
  code: string;
  name: string;
  event?: string;
  score?: string;
}

export interface EventNotificationProps {
  level: EventNotificationLevel;
  teams: EventNotificationTeam[];
  className?: string;
}

export const EventNotificationLevel = {
  New: "New",
  Goal: "Goal",
  FoulWarn: "FoulWarn",
  FoulAlert: "FoulAlert",
} as const;
export type EventNotificationLevel = (typeof EventNotificationLevel)[keyof typeof EventNotificationLevel];

export const EventNotificationLevelMap: Record<EventNotificationLevel, { name: string; color: string; }> = {
  [EventNotificationLevel.New]: { name: "NEW", color: "#9D84FF" },
  [EventNotificationLevel.Goal]: { name: "GOAL!", color: "#7BCA25" },
  [EventNotificationLevel.FoulWarn]: { name: "FOUL!", color: "#FFC51C" },
  [EventNotificationLevel.FoulAlert]: { name: "FOUL!", color: "#FF4242" },
};

interface EventBadgeProps {
  level: EventNotificationLevel;
  className?: string;
}

function EventBadge(props: EventBadgeProps) {
  const { level, className } = props;

  const levelInfo = EventNotificationLevelMap[level];

  if (!levelInfo) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-0 z-1",
        "text-white font-[Sora] text-lg font-[700] flex justify-center items-center h-[38px] rounded-xl w-[100px]",
        className,
      )}
      style={{
        backgroundColor: levelInfo.color,
      }}
    >
      {levelInfo.name}
    </div>
  );
}

function IconFoul(props: { level: EventNotificationLevel; event?: string; className?: string; }) {
  const { level, className, event } = props;

  if (!event) {
    return null;
  }

  const isFoul = event.toLowerCase?.() === "foul";

  if (!isFoul) {
    return null;
  }

  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 27 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-[27px] shrink-0 absolute -right-[14px] -top-[8px] z-1", className)}
    >
      <path
        d="M10.9023 2.5C12.0571 0.500241 14.9429 0.500243 16.0977 2.5L24.3252 16.75C25.4798 18.7499 24.0368 21.2498 21.7275 21.25H5.27246C2.96323 21.2498 1.52015 18.7499 2.6748 16.75L10.9023 2.5Z"
        fill={level === EventNotificationLevel.FoulWarn ? "#FDD357" : "#FF4242"}
        stroke="white"
        strokeWidth="2"
      />
      <path
        d="M12.5501 13.352V5.32H14.4701V13.352H12.5501ZM12.3901 17V14.84H14.6301V17H12.3901Z"
        fill="black"
      />
    </svg>
  );
}

export interface ShowEventNotificationOptions {
  level: EventNotificationLevel;
  teams: EventNotificationTeam[];
  className?: string;
  /**
   * Auto-dismiss duration in milliseconds.
   * - Default: 4000
   * - Pass 0 to disable auto-dismiss (manual dismiss required).
   */
  duration?: number;
}

export type EventNotificationDismiss = () => void;

type EventNotificationStoreItem = {
  id: string;
  props: ShowEventNotificationOptions;
};

const listeners = new Set<() => void>();
let current: EventNotificationStoreItem | null = null;
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

function emitStoreChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return current;
}

function getServerSnapshot(): EventNotificationStoreItem | null {
  return null;
}

function clearAutoDismissTimer() {
  if (!autoDismissTimer) return;
  clearTimeout(autoDismissTimer);
  autoDismissTimer = null;
}

function dismissById(targetId?: string) {
  if (typeof window === "undefined") return;

  if (targetId && current?.id !== targetId) {
    return;
  }

  clearAutoDismissTimer();
  current = null;
  emitStoreChange();
}

function scheduleAutoDismiss(id: string, durationMs: number) {
  clearAutoDismissTimer();

  if (durationMs === 0) {
    return;
  }

  autoDismissTimer = setTimeout(() => {
    dismissById(id);
  }, durationMs);
}

function EventNotificationHost() {
  const item = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!item || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="Match event notification"
      className="pointer-events-none fixed inset-x-0 top-[100px] z-[70] flex justify-center px-4"
    >
      <EventNotification {...item.props} />
    </div>,
    document.body,
  );
}

let hostRoot: ReturnType<typeof createRoot> | null = null;

function ensureHostMounted() {
  if (hostRoot) return;
  if (typeof document === "undefined") return;

  const selector = '[data-event-notification-host="true"]';
  const existing = document.querySelector<HTMLDivElement>(selector);

  const container =
    existing ??
    (() => {
      const created = document.createElement("div");
      created.setAttribute("data-event-notification-host", "true");
      document.body.appendChild(created);
      return created;
    })();

  hostRoot = createRoot(container);
  hostRoot.render(<EventNotificationHost />);
}

export function showEventNotification(
  options: ShowEventNotificationOptions,
): EventNotificationDismiss {
  if (typeof window === "undefined") {
    return () => {};
  }

  const levelInfo = EventNotificationLevelMap[options.level];
  if (!levelInfo || !options.teams?.length) {
    return () => {};
  }

  ensureHostMounted();

  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  current = {
    id,
    props: options,
  };
  emitStoreChange();

  const durationMs = options.duration ?? 4000;
  scheduleAutoDismiss(id, durationMs);

  return () => dismissById(id);
}

export function dismissEventNotification(): void {
  dismissById(undefined);
}

export function dismissAllEventNotifications(): void {
  dismissEventNotification();
}
