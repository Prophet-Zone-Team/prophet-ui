import { cn } from "@/lib/cn";

import { NewsItem } from "./news-item";
import type { NewsImpactItem } from "./types";

export type NewsListProps = {
  items: NewsImpactItem[];
  className?: string;
};

export function NewsList({ items, className }: NewsListProps) {
  return (
    <div className={cn("flex flex-col gap-[8px]", className)}>
      {items.map((item) => (
        <NewsItem key={item.id} item={item} />
      ))}
    </div>
  );
}
