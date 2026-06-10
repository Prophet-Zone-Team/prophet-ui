"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";
import {
  useDismissStrategyNotice,
  useShowStrategyNotice
} from "@/store/user-config-store";
import { useConfigHydrated } from "@/store/use-config-hydrated";

const STRATEGY_NOTICE_TRANSITION = {
  duration: 0.28,
  ease: [0.3, 0, 0.2, 1] as const
};

const STRATEGY_NOTICE_TEXT =
  "This strategy is generated from current market data and model estimates. It is for reference only and does not guarantee profit. Market prices and match outcomes may change, so please make your own decision based on your risk tolerance.";

export type StrategyNoticeProps = {
  className?: string;
};

export function StrategyNotice({ className }: StrategyNoticeProps) {
  const hydrated = useConfigHydrated();
  const visible = useShowStrategyNotice();
  const dismiss = useDismissStrategyNotice();
  const prefersReducedMotion = useReducedMotion();

  if (!hydrated) {
    return null;
  }

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          key="strategy-notice"
          role="status"
          aria-live="polite"
          initial={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -79 }}
          transition={STRATEGY_NOTICE_TRANSITION}
          className={cn(
            "flex min-h-[79px] w-full items-center gap-4 bg-[#3168FF] px-4 py-5 sm:px-6",
            className
          )}
        >
          <p className="min-w-0 flex-1 text-base leading-5 text-white">
            {STRATEGY_NOTICE_TEXT}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-10 w-32 shrink-0 items-center justify-center rounded-lg bg-white text-base leading-5 text-black transition-opacity hover:opacity-90"
          >
            Understood
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
