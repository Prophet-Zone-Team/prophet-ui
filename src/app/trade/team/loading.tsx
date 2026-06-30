import { LoadingBlock } from "@/components/ui/loading-block";
import {
  tradePageClass,
  tradePanelClass
} from "@/views/trade/trade-widget/trade-ui";

export default function TradeTeamRouteLoading() {
  return (
    <div
      className={`${tradePageClass} pb-[130px] md:pb-10`}
      aria-busy
      aria-label="Loading trade"
    >
      <div className="my-4 flex flex-col gap-3 md:hidden">
        <div className="flex items-center justify-between">
          <LoadingBlock className="h-5 w-12" />
          <LoadingBlock className="h-11 w-24" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <LoadingBlock className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <LoadingBlock className="h-8 w-40" />
              <LoadingBlock className="h-4 w-28" />
            </div>
          </div>
          <LoadingBlock className="h-9 w-24 shrink-0 rounded-lg" />
        </div>
      </div>

      <div className="mb-4 hidden gap-3 border-b border-prophet-line pb-4 md:flex">
        <LoadingBlock className="h-5 w-12" />
        <LoadingBlock className="h-14 w-14 shrink-0" />
        <div className="flex-1 space-y-2">
          <LoadingBlock className="h-7 w-48" />
          <LoadingBlock className="h-4 w-32" />
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 flex flex-col gap-4 xl:order-1">
          <LoadingBlock className="h-9 w-40 md:hidden" />

          <div className={`${tradePanelClass} p-5`}>
            <LoadingBlock className="mb-4 h-6 w-40" />
            <LoadingBlock className="mb-6 h-12 w-56" />
            <LoadingBlock className="h-[280px] w-full" />
          </div>

          <div className="md:hidden">
            <LoadingBlock className="h-12 w-full rounded-[12px]" />
          </div>

          <div className={tradePanelClass}>
            <div className="border-b border-prophet-line px-4 py-3">
              <LoadingBlock className="h-6 w-64" />
            </div>
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="border-b border-prophet-line px-4 py-3"
              >
                <LoadingBlock className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        <aside className="order-1 hidden flex-col gap-4 md:flex xl:order-2">
          <div className={`${tradePanelClass} p-4`}>
            <LoadingBlock className="mb-4 h-6 w-24" />
            <LoadingBlock className="mb-3 h-20 w-full" />
            <LoadingBlock className="h-11 w-full rounded-lg" />
          </div>
          <div className={tradePanelClass}>
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

      <div className="fixed bottom-0 left-0 z-10 flex w-full gap-5 rounded-t-xl border border-prophet-line bg-prophet-panel px-3 pb-10 pt-5 md:hidden">
        <LoadingBlock className="h-[46px] flex-1 rounded-xl" />
        <LoadingBlock className="h-[46px] flex-1 rounded-xl" />
      </div>
    </div>
  );
}
