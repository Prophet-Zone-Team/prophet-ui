"use client";

import "@/app/globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {


  return (
    <html lang="en">
      <body className="bg-prophet-base min-h-screen">
        <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
          <section className="w-full max-w-lg rounded-lg border border-[#E4E7EC] bg-prophet-panel p-8 shadow-sm">
            <p className="m-0 text-[10px] font-medium uppercase tracking-[0.28em] text-[#6B7280]">
              Application error
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-[#18110F]">
              Something went wrong
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#6B7280]">{error.message}</p>
            <div className="mt-8">
              <button
                type="button"
                className="flex h-[42px] w-full items-center justify-center rounded-[8px] bg-[#18110F] text-sm font-medium text-white"
                onClick={reset}
              >
                Try again
              </button>
            </div>
          </section>
        </div>
      </body>
    </html>
  );
}
