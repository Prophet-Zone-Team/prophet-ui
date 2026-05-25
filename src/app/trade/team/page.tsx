import { notFound } from "next/navigation";

import { renderTeamTradePage } from "@/app/trade/_shared/render-trade-page";

interface TradeTeamRouteProps {
  searchParams: Promise<{
    slug?: string;
  }>;
}

export default async function Page({ searchParams }: TradeTeamRouteProps) {
  const { slug } = await searchParams;

  if (!slug) {
    notFound();
  }

  return renderTeamTradePage(slug);
}
