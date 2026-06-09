const loadingSurface =
  "rounded-[7px] bg-[linear-gradient(90deg,rgba(225,237,249,0.72),rgba(255,255,255,0.94),rgba(225,237,249,0.72))] bg-prophet-shimmer animate-prophet-loading";

export default function FifaMatchesLoading() {
  return (
    <div role="tabpanel" className="min-w-0 pb-4">
      <div
        className={`${loadingSurface} mb-3.5 h-[120px] w-full rounded-xl`}
        aria-hidden="true"
      />

      <div
        className="mb-3 flex h-[34px] items-center justify-between gap-3 rounded-[20px] px-3 sm:px-4"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2">
          <div className={`${loadingSurface} h-7 w-16 rounded-full`} />
          <div className={`${loadingSurface} h-7 w-14 rounded-full`} />
        </div>
        <div className={`${loadingSurface} h-4 w-24`} />
      </div>

      <section aria-label="Loading match schedule">
        <div className={`${loadingSurface} mb-2.5 h-[19px] w-32`} />
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <div
                className={`${loadingSurface} min-h-[88px] w-full rounded-xl border border-[#EBEBEB]`}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
