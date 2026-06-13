import dynamic from "next/dynamic";

import PortfolioLoading from "./loading";

const PortfolioView = dynamic(
  () => import("@/views/portfolio").then((mod) => mod.PortfolioView),
  { loading: () => <PortfolioLoading /> },
);

export default function Page() {
  return <PortfolioView />;
}
