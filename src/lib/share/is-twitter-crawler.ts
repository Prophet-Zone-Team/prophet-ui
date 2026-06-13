export function isTwitterCrawler(userAgent: string | null): boolean {
  return /Twitterbot/i.test(userAgent ?? "");
}
