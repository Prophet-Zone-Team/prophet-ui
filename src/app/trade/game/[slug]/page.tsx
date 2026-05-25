import { renderGameTradePage } from "@/app/trade/_shared/render-trade-page";

interface TradeGameRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: TradeGameRouteProps) {
  const { slug } = await params;
  return renderGameTradePage(slug);
}
