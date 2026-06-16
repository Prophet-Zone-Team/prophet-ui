"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

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

export type StrategyNoticeProps = {
  className?: string;
};

export function StrategyNotice({ className }: StrategyNoticeProps) {
  const t = useTranslations("strategy");
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
            "flex min-h-[79px] w-full flex-col gap-3 bg-[#3168FF] px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-5",
            className
          )}
        >
          <p className="min-w-0 flex-1 text-sm leading-5 text-white sm:text-base">
            {t("noticeText")}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-lg bg-white text-base leading-5 text-black transition-opacity hover:opacity-90 sm:w-32"
          >
            {t("understood")}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
