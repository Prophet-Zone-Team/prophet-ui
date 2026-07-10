import { isCopyTradeRankPnl7dEnabled } from "@/config/copy-trade";

const copyTradeRankGridTemplateColumnsWithoutPnl7d =
  "36px minmax(0,1.4fr) minmax(72px,0.8fr) minmax(92px,0.85fr) minmax(80px,0.8fr) minmax(68px,0.75fr) minmax(104px,1fr)";

const copyTradeRankGridTemplateColumnsWithPnl7d =
  "36px minmax(0,1.4fr) minmax(72px,0.8fr) minmax(92px,0.85fr) minmax(80px,0.8fr) minmax(68px,0.75fr) minmax(180px,1.6fr) minmax(104px,1fr)";

export const copyTradeRankPnl7dEnabled = isCopyTradeRankPnl7dEnabled();

export const copyTradeRankGridTemplateColumns = copyTradeRankPnl7dEnabled
  ? copyTradeRankGridTemplateColumnsWithPnl7d
  : copyTradeRankGridTemplateColumnsWithoutPnl7d;

export const copyTradeRankTableGridClass =
  "hidden md:grid w-full min-w-0 gap-y-2 [grid-template-columns:var(--copy-trade-rank-cols)]";

export const copyTradeRankRowGridClass =
  "col-span-full grid gap-x-6 items-center max-md:[grid-template-columns:var(--copy-trade-rank-cols)] md:grid-cols-subgrid md:[grid-column:1/-1]";

export const copyTradeRankColRankClass = "w-full text-center tabular-nums";

export const copyTradeRankColPlayerClass = "min-w-0 w-full text-left";

export const copyTradeRankColStatClass = "w-full text-left tabular-nums";

export const copyTradeRankColPredictionsClass = "w-full text-left tabular-nums";

export const copyTradeRankColPnl7dClass =
  "min-w-max w-full whitespace-nowrap text-left text-[12px] leading-[14px] tabular-nums";

export const copyTradeRankColActionClass =
  "flex w-full items-center justify-end gap-2";

export const copyTradeRankGridStyle = {
  ["--copy-trade-rank-cols" as string]: copyTradeRankGridTemplateColumns
};
