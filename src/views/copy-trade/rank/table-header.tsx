import { cn } from "@/lib/cn";

import {
  copyTradeRankColActionClass,
  copyTradeRankColCenterClass,
  copyTradeRankColPlayerClass,
  copyTradeRankColPredictionsClass,
  copyTradeRankColRankClass,
  copyTradeRankGridStyle,
  copyTradeRankRowGridClass
} from "./grid";

export interface CopyTradeRankTableHeaderProps {
  className?: string;
}

export function CopyTradeRankTableHeader({
  className
}: CopyTradeRankTableHeaderProps) {
  return (
    <div
      role="row"
      style={copyTradeRankGridStyle}
      className={cn(
        copyTradeRankRowGridClass,
        "px-4 text-[14px] font-[400] leading-[17px] text-[#909090]",
        className
      )}
    >
      <span role="columnheader" className={copyTradeRankColRankClass}>
        #
      </span>
      <span role="columnheader" className={copyTradeRankColPlayerClass}>
        Player
      </span>
      <span role="columnheader" className={copyTradeRankColCenterClass}>
        Win Rate
      </span>
      <span role="columnheader" className={copyTradeRankColCenterClass}>
        Profit/Loss
      </span>
      <span role="columnheader" className={copyTradeRankColCenterClass}>
        Volume
      </span>
      <span role="columnheader" className={copyTradeRankColPredictionsClass}>
        Predictions
      </span>
      <span role="columnheader" className={copyTradeRankColActionClass}>
        Action
      </span>
    </div>
  );
}
