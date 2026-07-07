"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { PortfolioComboPositionCard } from "@/lib/portfolio/combo-positions/types";
import { PositionCard } from "@/views/combo/position-card";
import { PositionCardModal } from "@/views/combo/position-card-modal";

export type PortfolioComboPositionsProps = {
  combos: PortfolioComboPositionCard[];
  loading: boolean;
};

export function PortfolioComboPositions({
  combos,
  loading
}: PortfolioComboPositionsProps) {
  const t = useTranslations("portfolio");
  const [selectedCombo, setSelectedCombo] =
    useState<PortfolioComboPositionCard | null>(null);

  if (loading || combos.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="border-b border-prophet-line px-4 py-4"
        aria-label={t("yourComboPositions")}
      >
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex w-max min-w-full gap-3 px-1 flex-col md:flex-row">
            {combos.map((combo) => (
              <button
                key={combo.id}
                type="button"
                className="shrink-0 w-full md:w-auto cursor-pointer border-0 bg-transparent p-0 transition-opacity hover:opacity-95"
                onClick={() => setSelectedCombo(combo)}
                aria-label={t("viewComboPosition")}
              >
                <PositionCard
                  picks={combo.picks}
                  multiplier={combo.multiplier}
                  stakeAmount={combo.stakeAmount}
                  toWinAmount={combo.toWinAmount}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <PositionCardModal
        open={selectedCombo != null}
        combo={selectedCombo}
        onClose={() => setSelectedCombo(null)}
      />
    </>
  );
}
