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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";

import { TOAST_TOP_OFFSET_PX } from "@/config/toast-layout";
import { cn } from "@/lib/cn";
import { TeamFlag } from "../teams/team-flag";

const EVENT_NOTIFICATION_TRANSITION = {
  duration: 0.28,
  ease: [0.3, 0, 0.2, 1] as const
};

/** Enter from above; exit upward (queue handoff). */
const EVENT_NOTIFICATION_ENTER_Y = -28;
const EVENT_NOTIFICATION_EXIT_Y = -28;

export function EventNotification(props: EventNotificationProps) {
  const { level, teams, className } = props;

  const levelInfo = EventNotificationLevelMap[level];

  if (!levelInfo || teams.length < 2) {
    return null;
  }

  return (
    <div className={cn("relative w-[352px] pt-[19px]", className)}>
      <div
        className={cn(
          "relative flex h-[108px] w-[352px] items-center justify-between rounded-[12px] border bg-white px-6",
          "font-[Sora] font-medium text-black"
        )}
        style={{
          borderColor: levelInfo.color,
          boxShadow: `0px 0px 10px 0px ${levelInfo.color}`
        }}
      >
        <EventBadge level={level} />
        <TeamColumn team={teams[0]} level={level} />
        <ScoreRow teams={teams} highlightColor={levelInfo.color} />
        <TeamColumn team={teams[1]} level={level} />
      </div>
    </div>
  );
}

function TeamColumn(props: {
  team: EventNotificationTeam;
  level: EventNotificationLevel;
}) {
  const { team, level } = props;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div className="relative shrink-0">
        <TeamFlag
          code={team.code}
          name={team.name}
          className="!block size-[36px] min-w-[36px] shrink-0 rounded-[6px] shadow-[0px_0px_2px_rgba(0,0,0,0.2)]"
        />
        <IconFoul level={level} event={team.event} />
      </div>
      <div className="max-w-[102px] truncate text-center text-[16px] leading-5">
        {team.name}
      </div>
    </div>
  );
}

function ScoreRow(props: {
  teams: EventNotificationTeam[];
  highlightColor: string;
}) {
  const { teams, highlightColor } = props;

  return (
    <div className="flex shrink-0 items-center justify-center gap-[2px] text-[26px] leading-[33px]">
      <ScoreDigit
        score={teams[0]?.score}
        highlighted={teams[0]?.event?.toLowerCase?.() === "goal"}
        highlightColor={highlightColor}
      />
      <span>-</span>
      <ScoreDigit
        score={teams[1]?.score}
        highlighted={teams[1]?.event?.toLowerCase?.() === "goal"}
        highlightColor={highlightColor}
      />
    </div>
  );
}

function ScoreDigit(props: {
  score?: string;
  highlighted: boolean;
  highlightColor: string;
}) {
  const { score, highlighted, highlightColor } = props;

  if (highlighted) {
    return (
      <div
        className="flex size-[36px] items-center justify-center rounded-[12px]"
        style={{ backgroundColor: highlightColor }}
      >
        {score}
      </div>
    );
  }

  return <span className="min-w-[20px] text-center">{score}</span>;
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
  Goal: "Goal",
  FoulWarn: "FoulWarn",
  FoulAlert: "FoulAlert"
} as const;
export type EventNotificationLevel = (typeof EventNotificationLevel)[keyof typeof EventNotificationLevel];

export const EventNotificationLevelMap: Record<
  EventNotificationLevel,
  { name: string; color: string; shadowColor: string }
> = {
  [EventNotificationLevel.Goal]: {
    name: "GOAL!",
    color: "#7BCA25",
    shadowColor: "#7BCA25"
  },
  [EventNotificationLevel.FoulWarn]: {
    name: "FOUL!",
    color: "#FFC51C",
    shadowColor: "#FDD357"
  },
  [EventNotificationLevel.FoulAlert]: {
    name: "FOUL!",
    color: "#FF4242",
    shadowColor: "#FDD357"
  }
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
        "absolute left-1/2 top-0 z-1 flex h-[37px] w-[98px] -translate-x-1/2 -translate-y-1/2 items-center justify-center",
        "rounded-[12px] font-[Sora] text-[18px] font-bold leading-[23px] text-white",
        className
      )}
      style={{
        backgroundColor: levelInfo.color
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
  /** Called once when this notification is dismissed (auto or manual). */
  onDismiss?: () => void;
}

export type EventNotificationDismiss = () => void;

type EventNotificationStoreItem = {
  id: string;
  props: ShowEventNotificationOptions;
};

const listeners = new Set<() => void>();
let current: EventNotificationStoreItem | null = null;
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

type PendingExitDismiss = {
  id: string;
  onDismiss?: () => void;
};

let pendingExitDismiss: PendingExitDismiss | null = null;

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

  if (!current) {
    return;
  }

  pendingExitDismiss = {
    id: current.id,
    onDismiss: current.props.onDismiss
  };

  clearAutoDismissTimer();
  current = null;
  emitStoreChange();
}

function flushPendingExitDismiss(exitedId: string) {
  if (!pendingExitDismiss || pendingExitDismiss.id !== exitedId) {
    return;
  }

  const onDismiss = pendingExitDismiss.onDismiss;
  pendingExitDismiss = null;
  onDismiss?.();
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

function EventNotificationAnimatedItem({
  item
}: {
  item: EventNotificationStoreItem;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { onDismiss: _onDismiss, ...notificationProps } = item.props;

  return (
    <motion.div
      className="flex justify-center overflow-visible"
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: EVENT_NOTIFICATION_ENTER_Y }
      }
      animate={{ opacity: 1, y: 0 }}
      exit={
        prefersReducedMotion
          ? undefined
          : { opacity: 0, y: EVENT_NOTIFICATION_EXIT_Y }
      }
      transition={EVENT_NOTIFICATION_TRANSITION}
    >
      <EventNotification {...notificationProps} />
    </motion.div>
  );
}

function EventNotificationHost() {
  const item = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="Match event notification"
      className="pointer-events-none fixed inset-x-0 z-[50] flex justify-center overflow-visible px-4 pt-5"
      style={{ top: TOAST_TOP_OFFSET_PX }}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={() => {
          if (!pendingExitDismiss) {
            return;
          }

          flushPendingExitDismiss(pendingExitDismiss.id);
        }}
      >
        {item ? (
          <EventNotificationAnimatedItem key={item.id} item={item} />
        ) : null}
      </AnimatePresence>
    </div>,
    document.body
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
