"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="terminal-grid min-h-screen px-4 py-5 sm:px-7 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border border-terminal-red/45 bg-terminal-panel/90 p-6 shadow-terminal sm:p-8">
        <p className="terminal-label text-[10px] uppercase tracking-[0.28em] text-terminal-red">Market data error</p>
        <h1 className="mt-4 font-display text-5xl font-semibold uppercase leading-none text-terminal-text">
          Data feed interrupted
        </h1>
        <p className="mt-5 text-sm leading-7 text-terminal-muted">{error.message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded border border-terminal-cyan/60 bg-terminal-cyan/10 px-4 py-3 text-sm font-semibold text-terminal-cyan"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded border border-terminal-line bg-terminal-panel2 px-4 py-3 text-sm font-semibold text-terminal-muted"
          >
            Back to market
          </Link>
        </div>
      </div>
    </main>
  );
}
