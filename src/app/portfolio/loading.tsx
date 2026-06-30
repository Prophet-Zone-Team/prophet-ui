import { LoadingBlock } from "@/components/ui/loading-block";
import {
  portfolioActivityCardClass,
  portfolioPageClass,
  portfolioPositionsTableHeadClass,
  portfolioPositionsTableRowClass,
  portfolioSummaryCardClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

export default function PortfolioLoading() {
  return (
    <section className={portfolioPageClass} aria-label="Loading portfolio">
      <div className="flex flex-col gap-4">
        <section className={portfolioSummaryCardClass} aria-hidden="true">
          <div className="flex items-center gap-3">
            <LoadingBlock className="size-[52px] shrink-0 rounded-full" />
            <LoadingBlock className="h-6 w-28" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-[160px] w-1/2 flex-col justify-between pt-2">
              <div className="flex items-end gap-8 sm:gap-12">
                <div className="flex flex-col gap-1">
                  <LoadingBlock className="h-[17px] w-16" />
                  <LoadingBlock className="h-[38px] w-24" />
                </div>
                <div className="flex flex-col gap-1">
                  <LoadingBlock className="h-[17px] w-28" />
                  <LoadingBlock className="mt-2 h-6 w-20" />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <LoadingBlock className="h-[55px] max-w-[235px] flex-1 rounded-xl" />
                <LoadingBlock className="h-[55px] max-w-[235px] flex-1 rounded-xl" />
              </div>
            </div>

            <div
              className="hidden w-px shrink-0 self-stretch bg-prophet-line lg:block"
              aria-hidden="true"
            />

            <div className="flex w-1/2 flex-col justify-between gap-4 border-t border-prophet-line pt-6 lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <LoadingBlock className="h-[17px] w-24" />
                  <LoadingBlock className="h-[38px] w-32" />
                </div>
                <div className="flex shrink-0 gap-4">
                  {Array.from({ length: 5 }, (_, index) => (
                    <LoadingBlock key={index} className="h-[17px] w-6" />
                  ))}
                </div>
              </div>
              <LoadingBlock className="h-[83px] w-full" />
            </div>
          </div>
        </section>

        <section className={portfolioActivityCardClass} aria-hidden="true">
          <div className="shrink-0 border-b border-prophet-line px-4 pt-3">
            <div className="flex h-9 items-start gap-6">
              <LoadingBlock className="h-[19px] w-16" />
              <LoadingBlock className="h-[19px] w-24" />
              <LoadingBlock className="h-[19px] w-16" />
            </div>
          </div>

          <div className={portfolioTableScrollClass}>
            <div className={portfolioPositionsTableHeadClass}>
              {Array.from({ length: 6 }, (_, index) => (
                <LoadingBlock key={index} className="h-3 w-full" />
              ))}
            </div>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={portfolioPositionsTableRowClass}>
                {Array.from({ length: 6 }, (_, cellIndex) => (
                  <LoadingBlock key={cellIndex} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
