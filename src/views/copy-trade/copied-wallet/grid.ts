export const copyTradeCopiedWalletGridTemplateColumns =
  "minmax(0,1.6fr) minmax(88px,1fr) minmax(88px,1fr) minmax(72px,1fr) minmax(72px,1fr) minmax(96px,1fr) 140px";

export const copyTradeCopiedWalletTableGridClass =
  "grid w-full min-w-0 gap-x-6 gap-y-2 [grid-template-columns:var(--copy-trade-copied-wallet-cols)]";

export const copyTradeCopiedWalletRowGridClass =
  "col-span-full grid w-full min-w-0 items-center gap-x-6 [grid-template-columns:var(--copy-trade-copied-wallet-cols)]";

export const copyTradeCopiedWalletColWalletClass = "min-w-0 w-full text-left";

export const copyTradeCopiedWalletColDataClass =
  "w-full whitespace-nowrap text-left tabular-nums";

export const copyTradeCopiedWalletColActionClass =
  "flex w-full shrink-0 items-center justify-end gap-2.5 whitespace-nowrap";

export const copyTradeCopiedWalletGridStyle = {
  ["--copy-trade-copied-wallet-cols" as string]:
    copyTradeCopiedWalletGridTemplateColumns
};
