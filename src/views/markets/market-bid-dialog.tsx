"use client";

import { Modal } from "@/components/ui/modal";
import type { TeamMarketSnapshot } from "@/types/market";
import { TradeWidget } from "@/views/trade/trade-widget";

export interface MarketBidDialogProps {
  open: boolean;
  onClose: () => void;
  snapshot: TeamMarketSnapshot;
}

export function MarketBidDialog({
  open,
  onClose,
  snapshot
}: MarketBidDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={`Place order for ${snapshot.team.name}`}
      className="w-[420px]"
    >
      <TradeWidget snapshot={snapshot} />
    </Modal>
  );
}
