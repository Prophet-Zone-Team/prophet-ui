import type { NewsArticle } from "../../types/market";

export function getNewsArticleSlug(article: Pick<NewsArticle, "id" | "title">): string {
  const titleSlug = article.title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 72);
  const idSlug = article.id.replace(/[^\w-]/g, "").slice(0, 24);

  return `${titleSlug || "world-cup-news"}-${idSlug}`;
}

export function findNewsArticleBySlug(articles: NewsArticle[], slug: string): NewsArticle | undefined {
  return articles.find((article) => getNewsArticleSlug(article) === slug || article.id === slug);
}
