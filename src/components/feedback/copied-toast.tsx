"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export type CopiedToastProps = {
  visible: boolean;
  className?: string;
  style?: CSSProperties;
};

const COPIED_TOAST_TRANSITION = {
  duration: 0.2,
  ease: "easeInOut" as const
};

export function CopiedToast({ visible, className, style }: CopiedToastProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="copied-toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={COPIED_TOAST_TRANSITION}
          style={style}
          className={cn(
            "flex h-[46px] w-[118px] items-center justify-center gap-2 rounded-[12px] border border-prophet-line bg-prophet-panel shadow-[0_0_10px_rgba(0,0,0,0.1)]",
            className
          )}
        >
          <span
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-[#65AF14] text-white"
            aria-hidden="true"
          >
            <CheckIcon className="size-[11px]" />
          </span>
          <span className="text-[14px] font-normal leading-[18px] text-prophet-foreground">
            Copied!
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
