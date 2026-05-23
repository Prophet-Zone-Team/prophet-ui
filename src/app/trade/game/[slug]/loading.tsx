import {
  gameSimpleContentClass,
  gameSimpleColors
} from "@/views/trade/game/simple/game-simple-ui";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#ebebeb]/80 ${className ?? "h-4 w-full"}`}
      aria-hidden
    />
  );
}

export default function GameTradeLoading() {
  return (
    <div className={tradePageClass} aria-busy aria-label="Loading match trade">
      <div className="mb-3 flex justify-end">
        <LoadingBlock className="h-9 w-[219px]" />
      </div>

      <div className="-mx-4 sm:-mx-6">
        <div
          className="px-4 py-10 sm:px-6"
          style={{ backgroundColor: gameSimpleColors.headerBg }}
        >
          <div
            className={`${gameSimpleContentClass} flex items-center justify-between gap-4`}
          >
            <LoadingBlock className="h-[85px] w-[85px] rounded-[12px]" />
            <LoadingBlock className="h-16 w-24" />
            <LoadingBlock className="h-[85px] w-[85px] rounded-[12px]" />
          </div>
        </div>

        <div className={`${gameSimpleContentClass} flex flex-col gap-5 py-6`}>
          <LoadingBlock className="h-8 w-full" />
          <LoadingBlock className="h-5 w-full rounded-[10px]" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LoadingBlock className="h-[58px] rounded-[12px]" />
            <LoadingBlock className="h-[58px] rounded-[12px]" />
            <LoadingBlock className="h-[58px] rounded-[12px]" />
          </div>
          <LoadingBlock className="h-[360px] w-full rounded-[12px]" />
        </div>
      </div>
    </div>
  );
}
