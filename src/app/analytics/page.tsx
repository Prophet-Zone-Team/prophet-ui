import dynamic from "next/dynamic";

const Analytics = dynamic(() => import("@/views/analytics"), {
  loading: () => null,
});

export default function AnalyticsPage() {
  return <Analytics />;
}
