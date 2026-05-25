export function teamDetailHref(teamId: string) {
  return `/team?slug=${encodeURIComponent(teamId)}`;
}
