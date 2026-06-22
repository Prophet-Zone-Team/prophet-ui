import { Fragment } from "react";

import { POSITION_PICK_CONNECTOR_HEIGHT_PX } from "./constants";
import { PositionPickItem } from "./position-pick-item";
import type { PositionPick } from "./types";

export type PositionPickListProps = {
  picks: PositionPick[];
};

export function PositionPickList({ picks }: PositionPickListProps) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div className="flex flex-col">
        {picks.map((pick, index) => (
          <Fragment key={pick.id}>
            <PositionPickItem pick={pick} />

            {index < picks.length - 1 ? (
              <div
                aria-hidden="true"
                className="ml-[11px] w-px shrink-0 bg-[#909090]"
                style={{ height: `${POSITION_PICK_CONNECTOR_HEIGHT_PX}px` }}
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
