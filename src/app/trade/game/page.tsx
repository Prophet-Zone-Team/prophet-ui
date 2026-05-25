import { notFound } from "next/navigation";

import { renderGameTradePage } from "@/app/trade/_shared/render-trade-page";

interface TradeGameRouteProps {
  searchParams: Promise<{
    slug?: string;
  }>;
}

export default async function Page({ searchParams }: TradeGameRouteProps) {
  const { slug } = await searchParams;

  if (!slug) {
    notFound();
  }

  return renderGameTradePage(slug);
}
