export default function Loading() {
  return (
    <main className="terminal-grid min-h-screen px-4 py-5 sm:px-7 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-6">
        <div className="rounded-lg border border-terminal-line bg-terminal-panel/90 p-6 shadow-terminal">
          <p className="terminal-label text-[10px] uppercase tracking-[0.28em] text-terminal-cyan">Loading market data</p>
          <div className="mt-6 h-10 max-w-lg animate-pulse rounded bg-terminal-panel2" />
          <div className="mt-4 h-4 max-w-2xl animate-pulse rounded bg-terminal-panel2" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-lg border border-terminal-line bg-terminal-panel/80" />
          ))}
        </div>
      </div>
    </main>
  );
}
