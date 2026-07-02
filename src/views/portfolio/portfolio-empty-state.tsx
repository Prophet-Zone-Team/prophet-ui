export interface PortfolioEmptyStateProps {
  title: string;
  body: string;
}

export function PortfolioEmptyState({ title, body }: PortfolioEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <strong className="text-sm font-[500] text-prophet-foreground">{title}</strong>
      <p className="m-0 max-w-md text-sm text-prophet-muted">{body}</p>
    </div>
  );
}
