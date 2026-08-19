import { cn } from "@/lib/cn";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

export const marketsPageClass = cn(tradePageClass, "pb-[130px] md:pb-10");

export const marketsLayoutClass =
  "flex flex-col gap-6 pt-[10px] md:grid md:grid-cols-[minmax(0,1fr)_345px] md:items-start xl:grid-cols-[198px_minmax(0,1fr)_345px] xl:gap-5";

export const marketsNavAsideClass =
  "hidden min-w-0 xl:block xl:w-[198px] xl:sticky xl:top-14 xl:self-start";

export const marketsListMainClass = "order-2 min-w-0 md:order-1";

export const marketsTradeAsideClass =
  "order-1 flex min-w-0 flex-col gap-4 md:order-2 md:sticky md:top-14 md:self-start";
