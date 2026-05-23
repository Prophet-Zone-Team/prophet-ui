import { redirect } from "next/navigation";

interface LegacyTradeRedirectProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: LegacyTradeRedirectProps) {
  const { slug } = await params;
  redirect(`/trade/team/${slug}`);
}
