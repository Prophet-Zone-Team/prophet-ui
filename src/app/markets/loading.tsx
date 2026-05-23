const loadingSurface =
  "rounded-[7px] bg-[linear-gradient(90deg,rgba(225,237,249,0.72),rgba(255,255,255,0.94),rgba(225,237,249,0.72))] bg-prophet-shimmer animate-prophet-loading";

export default function MarketsLoading() {
  return (
    <section className="mx-auto max-w-[1112px]">
      <section
        className="flex justify-between py-14 pb-8"
        aria-label="Loading World Cup markets"
      >
        <div className="min-w-0 flex-1">
          <div className={`${loadingSurface} h-[26px] w-[220px]`} />
          <div
            className={`${loadingSurface} mt-3 h-[50px] w-full max-w-[520px]`}
          />
          <div className={cnLine("mt-3 w-[140px]")} />
          <div
            className="mt-2 flex justify-between gap-2"
            aria-hidden="true"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex-1 p-3 text-center">
                <div
                  className={`${loadingSurface} mx-auto h-[38px] w-16`}
                />
                <div className={`${loadingSurface} mx-auto mt-1 h-3.5 w-20`} />
              </div>
            ))}
          </div>
        </div>
        <div
          className={`${loadingSurface} ml-6 hidden h-[160px] w-[180px] shrink-0 sm:block`}
          aria-hidden="true"
        />
      </section>

      <div
        className="mb-6 flex h-9 w-[219px] items-start justify-between"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center">
          <div className={`${loadingSurface} h-[21px] w-14`} />
          <div className={`${loadingSurface} mt-auto h-[3px] w-10`} />
        </div>
        <div className="flex flex-col items-center">
          <div className={`${loadingSurface} h-[21px] w-16`} />
          <div className="mt-auto h-[3px] w-10" />
        </div>
      </div>

      <div role="tabpanel">
        <section
          className="mb-4 min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-5 pb-5 pt-4"
          aria-label="Loading winner probability chart"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className={`${loadingSurface} h-6 w-[280px] max-w-full`} />
            <div className="flex flex-wrap items-center gap-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className={`${loadingSurface} h-[17px] w-8`}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={`${loadingSurface} h-[17px] w-28`} />
            ))}
          </div>

          <div
            className={`${loadingSurface} mt-4 h-[190px] w-full rounded-[7px]`}
            aria-hidden="true"
          />
        </section>

        <section
          className="min-w-0 bg-prophet-panel p-[18px] shadow-prophet backdrop-blur-2xl"
          aria-label="Loading team market list"
        >
          <div className="grid gap-2" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className={`${loadingSurface} min-h-[78px] rounded-xl border border-[#EBEBEB]`}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap justify-between gap-4">
            <div className={cnLine("w-[72%] max-w-[420px]")} />
            <div className={cnLine("w-28")} />
          </div>
        </section>
      </div>
    </section>
  );
}

function cnLine(widthClass: string) {
  return `${loadingSurface} h-3.5 ${widthClass}`;
}
