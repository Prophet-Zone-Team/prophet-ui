"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/cn";
import {
  Orderbook,
  type OrderbookVariant
} from "@/views/trade/team/orderbook";

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
  variant?: OrderbookVariant;
}

export function OrderbookPanel({
  visible,
  tokenId,
  className,
  variant = "stacked"
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
            "flex min-h-0 w-full flex-col overflow-hidden",
            className
          )}
        >
          <Orderbook
            key={tokenId ?? "orderbook"}
            tokenId={tokenId}
            variant={variant}
            className="min-h-0 flex-1"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
