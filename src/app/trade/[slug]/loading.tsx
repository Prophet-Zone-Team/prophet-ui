import {
  tradePageClass,
  tradeSectionClass
} from "@/views/trade/trade-widget/trade-ui";

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#ebebeb]/80 ${className ?? "h-4 w-full"}`}
      aria-hidden
    />
  );
}

export default function TradeLoading() {
  return (
    <div className={tradePageClass} aria-busy aria-label="Loading trade">
      <div className="mb-4 flex gap-3 border-b border-prophet-line pb-4">
        <LoadingBlock className="h-5 w-12" />
        <LoadingBlock className="h-14 w-14 shrink-0" />
        <div className="flex-1 space-y-2">
          <LoadingBlock className="h-7 w-48" />
          <LoadingBlock className="h-4 w-32" />
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 flex flex-col gap-4 xl:order-1">
          <div className={`${tradeSectionClass} p-5`}>
            <LoadingBlock className="mb-4 h-6 w-40" />
            <LoadingBlock className="mb-6 h-12 w-56" />
            <LoadingBlock className="h-[280px] w-full" />
          </div>
          <div className={tradeSectionClass}>
            <div className="border-b border-prophet-line px-4 py-3">
              <LoadingBlock className="h-6 w-64" />
            </div>
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="border-b border-prophet-line/60 px-4 py-3"
              >
                <LoadingBlock className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        <aside className="order-1 flex flex-col gap-4 xl:order-2">
          <div className={`${tradeSectionClass} p-4`}>
            <LoadingBlock className="mb-4 h-6 w-24" />
            <LoadingBlock className="mb-3 h-20 w-full" />
            <LoadingBlock className="h-11 w-full rounded-lg" />
          </div>
          <div className={tradeSectionClass}>
            <div className="border-b border-prophet-line px-4 py-3">
              <LoadingBlock className="h-5 w-36" />
            </div>
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="m-3 rounded-xl border border-prophet-line p-3"
              >
                <LoadingBlock className="mb-2 h-4 w-20" />
                <LoadingBlock className="h-16 w-full" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
