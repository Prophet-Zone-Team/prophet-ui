"use client";

export function TeamSellPlaceholder() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center px-4 py-10 text-center">
      <strong className="text-sm font-[556] text-black">Sell coming soon</strong>
      <p className="m-0 mt-2 max-w-xs text-sm text-prophet-muted">
        Sell-side order entry for this market will be added in a later release.
      </p>
    </div>
  );
}
