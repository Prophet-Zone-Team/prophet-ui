export interface TeamEmptyStateProps {
  title: string;
  body: string;
}

export function TeamEmptyState({ title, body }: TeamEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-prophet-line bg-[#fafbfc] px-4 py-6 text-center">
      <strong className="block text-sm font-[500] text-black">{title}</strong>
      <p className="m-0 mt-2 text-xs leading-relaxed text-prophet-muted">
        {body}
      </p>
    </div>
  );
}
