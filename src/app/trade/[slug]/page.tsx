import { resolveTradeRedirect } from "@/app/trade/_shared/render-trade-page";

interface LegacyTradeRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: LegacyTradeRouteProps) {
  const { slug } = await params;
  return resolveTradeRedirect(slug);
}
