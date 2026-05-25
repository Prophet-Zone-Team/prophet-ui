export default function TeamLoading() {
  return (
    <div
      className="mx-auto max-w-[1440px] px-4 pb-10 pt-2 sm:px-6"
      aria-busy
      aria-label="Loading team page"
    >
      <div className="my-4">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-[#ebebeb]/80" />
        <div className="animate-pulse rounded-[12px] border border-prophet-line bg-gradient-to-br from-[#f5f9ff] to-white p-5">
          <div className="flex gap-3">
            <div className="size-[68px] rounded-lg bg-[#ebebeb]/80" />
            <div className="flex-1 space-y-2">
              <div className="h-8 w-48 rounded bg-[#ebebeb]/80" />
              <div className="h-4 w-64 rounded bg-[#ebebeb]/80" />
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-[#ebebeb]/80" />
                <div className="h-6 w-16 rounded-full bg-[#ebebeb]/80" />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-14 rounded-lg bg-[#ebebeb]/80"
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-hidden
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-[178px] animate-pulse rounded-[12px] border border-prophet-line bg-white"
          />
        ))}
      </div>

      <div
        className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_345px]"
        aria-label="Loading team analysis"
      >
        <div className="order-2 flex flex-col gap-4 xl:order-1">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-[320px] animate-pulse rounded-[12px] border border-prophet-line bg-white" />
            <div className="h-[320px] animate-pulse rounded-[12px] border border-prophet-line bg-white" />
          </div>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-[12px] border border-prophet-line bg-white"
            />
          ))}
        </div>

        <aside className="order-1 flex flex-col gap-4 xl:order-2">
          <div className="h-36 animate-pulse rounded-[12px] border border-prophet-line bg-white" />
          <div className="h-[420px] animate-pulse rounded-[12px] border border-prophet-line bg-white" />
          <div className="h-56 animate-pulse rounded-[12px] border border-prophet-line bg-white" />
          <div className="h-64 animate-pulse rounded-[12px] border border-prophet-line bg-white" />
        </aside>
      </div>
    </div>
  );
}
