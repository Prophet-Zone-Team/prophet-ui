export const copyTradeRankGridTemplateColumns =
  "36px minmax(0,1.6fr) minmax(88px,1fr) minmax(112px,1fr) minmax(96px,1fr) minmax(88px,1fr) minmax(96px,1fr) minmax(112px,1fr)";

export const copyTradeRankTableGridClass =
  "grid w-full min-w-0 gap-y-2 [grid-template-columns:var(--copy-trade-rank-cols)]";

export const copyTradeRankRowGridClass =
  "col-span-full grid gap-x-6 items-center max-md:[grid-template-columns:var(--copy-trade-rank-cols)] md:grid-cols-subgrid md:[grid-column:1/-1]";

export const copyTradeRankColRankClass = "w-full text-center tabular-nums";

export const copyTradeRankColPlayerClass = "min-w-0 w-full text-left";

export const copyTradeRankColStatClass = "w-full text-left tabular-nums";

export const copyTradeRankColPredictionsClass = "w-full text-left tabular-nums";

export const copyTradeRankColActionClass =
  "flex w-full items-center justify-end gap-2";

export const copyTradeRankGridStyle = {
  ["--copy-trade-rank-cols" as string]: copyTradeRankGridTemplateColumns
};
