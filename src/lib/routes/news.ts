export function newsDetailHref(slug: string) {
  return `/news?slug=${encodeURIComponent(slug)}`;
}
