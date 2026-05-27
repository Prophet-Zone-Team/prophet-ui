"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

const TITLE_ICON_CYCLE_MS = 2400;

const TITLE_ICON_TRANSITION = {
  duration: 0.3,
  ease: [0.3, 0, 0.2, 1] as const
};

const TITLE_ICON_ENTER_Y = "100%";
const TITLE_ICON_EXIT_Y = "-100%";

const TITLE_ICONS = [
  { id: "football", src: "/fifa/title/football.png" },
  { id: "money", src: "/fifa/title/money.png" },
  { id: "percentage", src: "/fifa/title/percentage.png" }
] as const;

export function HomeHeroTitleIconCycle({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const icon = TITLE_ICONS[index];

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const timerId = window.setInterval(() => {
      setIndex((current) => (current + 1) % TITLE_ICONS.length);
    }, TITLE_ICON_CYCLE_MS);

    return () => window.clearInterval(timerId);
  }, [prefersReducedMotion]);

  return (
    <span
      className={cn(
        "relative inline-flex h-[56px] w-[56px] shrink-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={icon.id}
          className="absolute inset-0 flex items-center justify-center"
          initial={
            prefersReducedMotion ? false : { y: TITLE_ICON_ENTER_Y, opacity: 0 }
          }
          animate={{ y: 0, opacity: 1 }}
          exit={
            prefersReducedMotion
              ? undefined
              : { y: TITLE_ICON_EXIT_Y, opacity: 0 }
          }
          transition={TITLE_ICON_TRANSITION}
        >
          <img
            src={icon.src}
            alt=""
            width={56}
            height={56}
            className="h-[56px] w-[56px] object-contain"
            draggable={false}
          />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
