"use client";

export function TradesTable() {
  return (
    <div className="px-4 py-10 text-center">
      <strong className="block text-sm font-[556] text-black">
        Market trades unavailable
      </strong>
      <p className="m-0 mt-2 text-sm text-prophet-muted">
        Public trade feed for this market is not connected yet. This view will
        show Time, Type, Side, Price, Value, and Trader when the data source is
        ready.
      </p>
    </div>
  );
}

export function TradesTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2 text-xs font-[556] text-prophet-muted">
      <span>Time</span>
      <span>Type</span>
      <span>Side</span>
      <span>Price</span>
      <span>Value</span>
      <span>Trader</span>
    </div>
  );
}
