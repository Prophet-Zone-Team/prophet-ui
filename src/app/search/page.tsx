import { SearchPage } from "../../components/search/SearchPage";

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <SearchPage initialQuery={params.q ?? ""} />;
}
