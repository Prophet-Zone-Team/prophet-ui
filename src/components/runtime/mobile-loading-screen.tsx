"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const MIN_DISPLAY_MS = 1200;
const EXIT_DURATION_S = 0.35;

function useMobileLoadingVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const startedAt = Date.now();

    const dismiss = () => {
      const remaining = Math.max(0, MIN_DISPLAY_MS - (Date.now() - startedAt));
      window.setTimeout(() => setVisible(false), remaining);
    };

    if (document.readyState === "complete") {
      dismiss();
      return;
    }

    window.addEventListener("load", dismiss, { once: true });
    return () => window.removeEventListener("load", dismiss);
  }, []);

  return visible;
}

export function MobileLoadingScreen() {
  const t = useTranslations("home");
  const visible = useMobileLoadingVisible();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="mobile-loading-screen"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-prophet-base md:hidden"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={t("mobileLoadingAria")}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : EXIT_DURATION_S,
            ease: [0.3, 0, 0.2, 1]
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[136px] top-[488px] size-[273px] rounded-full bg-[rgba(49,104,255,0.1)] blur-[100px]"
          />

          <div className="flex flex-col items-center px-6">
            <div className="flex flex-col items-center gap-[13px]">
              <img
                src="/logo.svg"
                alt=""
                width={50}
                height={45}
                className="block size-[50px]"
                aria-hidden="true"
                draggable={false}
              />
              <span className="font-[Sora] text-[18px] font-medium leading-[19px] text-prophet-foreground">
                PROPHET
              </span>
            </div>

            <div className="mt-[33px] flex flex-col items-center text-center font-[Sora] text-[36px] font-semibold capitalize leading-[45px] text-prophet-foreground">
              <p className="m-0">{t("heroTaglineBefore")}</p>
              <p className="m-0 inline-flex items-center gap-[6px]">
                <span>{t("heroTaglineMoves")}</span>
                <img
                  src="/fifa/title/football.png"
                  alt=""
                  width={50}
                  height={50}
                  className="size-[50px] shrink-0 object-contain"
                  aria-hidden="true"
                  draggable={false}
                />
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
