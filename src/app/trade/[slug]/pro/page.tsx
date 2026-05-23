import { renderTradePage } from "@/app/trade/_shared/render-trade-page";

interface TradeRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: TradeRouteProps) {
  const { slug } = await params;
  return renderTradePage(slug, "pro");
}
