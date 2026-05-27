"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { Orderbook } from "@/views/trade/team/orderbook";

const ORDERBOOK_PANEL_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85
};

export interface OrderbookPanelProps {
  visible: boolean;
  tokenId?: string;
  className?: string;
}

export function OrderbookPanel({
  visible,
  tokenId,
  className
}: OrderbookPanelProps) {
  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          key="orderbook-panel"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={ORDERBOOK_PANEL_TRANSITION}
          className={cn(
            "h-full min-h-0 w-full shrink-0 self-stretch overflow-hidden xl:w-[272px]",
            className
          )}
        >
          <Orderbook
            key={tokenId ?? "orderbook"}
            tokenId={tokenId}
            className="h-full w-full xl:w-[272px]"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
