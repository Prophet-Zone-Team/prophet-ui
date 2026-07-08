import dynamic from "next/dynamic";
import { Suspense } from "react";

const CopyTradePortfolioView = dynamic(
  () =>
    import("@/views/copy-trade/portfolio").then(
      (mod) => mod.CopyTradePortfolioView
    ),
  {
    loading: () => (
      <div className="mx-auto w-full px-3 py-5 text-sm text-[#909090] md:w-[1112px]">
        Loading portfolio…
      </div>
    )
  }
);

function CopyTradePortfolioLoading() {
  return (
    <div className="mx-auto w-full px-3 py-5 text-sm text-[#909090] md:w-[1112px]">
      Loading portfolio…
    </div>
  );
}

export default function CopyTradePortfolioPage() {
  return (
    <Suspense fallback={<CopyTradePortfolioLoading />}>
      <CopyTradePortfolioView />
    </Suspense>
  );
}
