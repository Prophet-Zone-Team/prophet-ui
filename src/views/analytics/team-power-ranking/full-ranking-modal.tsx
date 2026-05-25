"use client";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

import { RankingTable } from "./ranking-table";
import type { TeamPowerRankingEntry } from "./types";

export type FullRankingModalProps = {
  open: boolean;
  onClose: () => void;
  entries: TeamPowerRankingEntry[];
};

export function FullRankingModal({
  open,
  onClose,
  entries
}: FullRankingModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Full team power ranking"
      className="w-full max-w-[560px]"
    >
      <div
        className={cn(
          "box-border rounded-[12px] border border-[#EBEBEB] bg-white",
          "px-0 pb-[20px] pt-[20px]"
        )}
      >
        <h2 className="m-0 px-[20px] text-[18px] font-[457] leading-[21px] text-black">
          Team Power Ranking
        </h2>
        <p className="m-0 mt-[6px] px-[20px] text-[14px] font-[400] leading-[17px] text-[#909090]">
          Market-derived title and knockout-stage probabilities
        </p>
        <div className="mt-[16px] max-h-[min(60vh,520px)] overflow-y-auto">
          <RankingTable
            entries={entries}
            rowGapClassName="gap-y-[8px]"
          />
        </div>
      </div>
    </Modal>
  );
}
