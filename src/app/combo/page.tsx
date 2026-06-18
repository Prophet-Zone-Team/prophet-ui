import dynamic from "next/dynamic";

const ComboPageView = dynamic(
  () => import("@/views/combo/combo-page-view").then((mod) => mod.ComboPageView),
  {
    loading: () => (
      <section className="mx-auto w-full max-w-[1200px] px-3 py-8 md:px-4">
        <div className="h-8 w-40 animate-pulse rounded bg-[#F2F2F2]" />
      </section>
    ),
  },
);

export default function ComboPage() {
  return <ComboPageView />;
}
