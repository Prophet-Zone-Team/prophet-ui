import { tradePageClass, tradeSectionClass } from "../../../../views/trade/tradeUi";

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
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-prophet-line pb-4">
        <LoadingBlock className="h-5 w-12" />
        <LoadingBlock className="h-5 w-24" />
      </div>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 flex flex-col gap-4 xl:order-1">
          <div className={`${tradeSectionClass} p-5`}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <LoadingBlock className="h-16 w-16 rounded-lg" />
              <LoadingBlock className="h-10 w-20" />
              <LoadingBlock className="h-16 w-16 rounded-lg" />
            </div>
            <LoadingBlock className="mb-4 h-2 w-full rounded-full" />
            <LoadingBlock className="mb-6 h-12 w-56" />
            <LoadingBlock className="h-[280px] w-full" />
          </div>
        </div>

        <aside className="order-1 flex flex-col gap-4 xl:order-2">
          <div className={`${tradeSectionClass} p-4`}>
            <LoadingBlock className="mb-4 h-6 w-32" />
            <LoadingBlock className="mb-3 h-20 w-full" />
            <LoadingBlock className="h-11 w-full rounded-lg" />
          </div>
        </aside>
      </div>
    </div>
  );
}
