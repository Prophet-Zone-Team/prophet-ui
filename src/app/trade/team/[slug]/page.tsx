import { renderTeamTradePage } from "@/app/trade/_shared/render-trade-page";

interface TradeTeamRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: TradeTeamRouteProps) {
  const { slug } = await params;
  return renderTeamTradePage(slug);
}
