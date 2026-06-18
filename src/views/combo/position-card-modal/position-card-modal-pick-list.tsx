import { Fragment } from "react";

import type { PortfolioComboPositionPick } from "@/lib/portfolio/combo-positions/types";

import { POSITION_CARD_MODAL_PICK_CONNECTOR_HEIGHT_PX } from "./constants";
import { PositionCardModalPickItem } from "./position-card-modal-pick-item";

export type PositionCardModalPickListProps = {
  picks: PortfolioComboPositionPick[];
};

export function PositionCardModalPickList({
  picks
}: PositionCardModalPickListProps) {
  return (
    <div className="flex flex-col px-4 pb-4 pt-3">
      {picks.map((pick, index) => (
        <Fragment key={pick.id}>
          <PositionCardModalPickItem pick={pick} />

          {index < picks.length - 1 ? (
            <div
              aria-hidden="true"
              className="ml-[11px] w-px shrink-0 bg-[#909090]"
              style={{ height: `${POSITION_CARD_MODAL_PICK_CONNECTOR_HEIGHT_PX}px` }}
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
