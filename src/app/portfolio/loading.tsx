import { portfolioActivityCardClass, portfolioPageClass, portfolioSummaryCardClass } from "@/views/portfolio/portfolio-ui";

export default function PortfolioLoading() {
  return (
    <section className={portfolioPageClass} aria-label="Loading portfolio">
      <header className="mb-6">
        <div className="h-3 w-16 animate-pulse rounded bg-prophet-line" />
        <div className="mt-2 h-7 w-48 animate-pulse rounded bg-prophet-line" />
        <div className="mt-2 h-4 w-full max-w-2xl animate-pulse rounded bg-prophet-line" />
      </header>

      <div className="flex flex-col gap-4">
        <div className={`${portfolioSummaryCardClass} animate-pulse`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:h-full">
            <div className="flex flex-1 flex-col justify-between gap-5 lg:pr-8">
              <div className="flex items-center gap-3">
                <div className="size-[52px] rounded-full bg-prophet-line" />
                <div className="h-6 w-28 rounded bg-prophet-line" />
              </div>
              <div className="flex gap-12">
                <div className="h-[38px] w-32 rounded bg-prophet-line" />
                <div className="h-6 w-20 rounded bg-prophet-line" />
              </div>
              <div className="flex gap-3">
                <div className="h-[55px] w-[235px] max-w-full rounded-xl bg-prophet-line" />
                <div className="h-[55px] w-[235px] max-w-full rounded-xl bg-prophet-line/70" />
              </div>
            </div>
            <div className="hidden w-px shrink-0 bg-prophet-line lg:block" />
            <div className="flex flex-1 flex-col justify-between gap-4 lg:pl-8">
              <div className="flex justify-between gap-4">
                <div className="h-[38px] w-32 rounded bg-prophet-line" />
                <div className="h-4 w-40 rounded bg-prophet-line" />
              </div>
              <div className="h-[83px] rounded bg-prophet-line/60" />
            </div>
          </div>
        </div>

        <div className={`${portfolioActivityCardClass} animate-pulse`}>
          <div className="border-b border-[#EBEBEB] px-4 py-3">
            <div className="h-6 w-64 rounded bg-prophet-line" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-12 rounded bg-prophet-line/70" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
