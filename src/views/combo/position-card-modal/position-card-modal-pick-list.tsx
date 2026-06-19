import { Fragment } from "react";

import { cn } from "@/lib/cn";
import type { PortfolioComboPositionPick } from "@/lib/portfolio/combo-positions/types";

import { POSITION_CARD_MODAL_PICK_CONNECTOR_HEIGHT_PX } from "./constants";
import { PositionCardModalPickItem } from "./position-card-modal-pick-item";

export type PositionCardModalPickListProps = {
  picks: PortfolioComboPositionPick[];
  className?: string;
  connectorHeightPx?: number;
};

export function PositionCardModalPickList({
  picks,
  className,
  connectorHeightPx = POSITION_CARD_MODAL_PICK_CONNECTOR_HEIGHT_PX
}: PositionCardModalPickListProps) {
  return (
    <div className={cn("flex flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-3", className)}>
      {picks.map((pick, index) => (
        <Fragment key={pick.id}>
          <PositionCardModalPickItem pick={pick} />

          {index < picks.length - 1 ? (
            <div
              aria-hidden="true"
              className="ml-[11px] w-px shrink-0 bg-[#909090]"
              style={{ height: `${connectorHeightPx}px` }}
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
