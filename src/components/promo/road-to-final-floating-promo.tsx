"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import {
  useRoadToFinalPromoHydrated,
  useRoadToFinalPromoStore,
} from "@/store/road-to-final-promo-store";

const PROMO_SHOW_DELAY_MS = 2500;

const PROMO_TRANSITION = {
  duration: 0.3,
  ease: [0.3, 0, 0.2, 1] as const,
};

export function RoadToFinalFloatingPromo() {
  const t = useTranslations("home");
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useRoadToFinalPromoHydrated();
  const dismissed = useRoadToFinalPromoStore((state) => state.dismissed);
  const dismiss = useRoadToFinalPromoStore((state) => state.dismiss);
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  const isRoadToFinalPage = pathname.startsWith("/road-to-final");

  useEffect(() => {
    if (!hydrated || dismissed || isRoadToFinalPage) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, PROMO_SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dismissed, hydrated, isRoadToFinalPage]);

  if (!hydrated || dismissed || isRoadToFinalPage) {
    return null;
  }

  const motionProps = prefersReducedMotion
    ? {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    }
    : {
      initial: { opacity: 0, y: 50, scale: 1 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 50, scale: 1 },
    };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="road-to-final-floating-promo"
          {...motionProps}
          transition={PROMO_TRANSITION}
          className={cn(
            "fixed z-[60] w-[276px] max-w-[calc(100vw-24px)]",
            "bottom-[calc(74px+env(safe-area-inset-bottom,0px)+12px)] right-3",
            "md:bottom-6 md:right-6",
          )}
        >
          <button
            type="button"
            aria-label={t("roadToFinalPromoAria")}
            onClick={() => {
              router.push("/road-to-final");
            }}
            className="relative block w-full overflow-visible rounded-[8px] text-left shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            <div className="relative h-[184px] w-full overflow-hidden rounded-[8px]">
              <img
                src="/analytics/banner-sm.png"
                alt=""
                sizes="276px"
                className="object-cover object-center"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 px-5 pb-3">
              <span
                aria-hidden="true"
                className="pointer-events-none flex h-8 w-full items-center justify-center rounded-[8px] border border-[#ffca9c] bg-gradient-to-r from-[#f4b600] to-[#8e6a00] text-[14px] font-medium text-white shadow-[0_0_10px_rgba(0,0,0,0.1)]"
              >
                Predict
              </span>
            </div>
          </button>

          <button
            type="button"
            aria-label="Close"
            onClick={(event) => {
              event.stopPropagation();
              dismiss();
              setVisible(false);
            }}
            className="absolute -right-3 -top-3 inline-flex size-6 items-center justify-center rounded-full bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-opacity hover:opacity-90"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
