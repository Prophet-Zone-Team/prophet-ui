import { cn } from "@/lib/cn";

import { NewsItem } from "./news-item";
import type { NewsImpactItem } from "./types";

export type NewsListProps = {
  items: NewsImpactItem[];
  onItemSelect?: (item: NewsImpactItem) => void;
  className?: string;
};

export function NewsList({ items, onItemSelect, className }: NewsListProps) {
  return (
    <div className={cn("flex flex-col gap-[8px]", className)}>
      {items.map((item) => (
        <NewsItem
          key={item.id}
          item={item}
          onSelect={onItemSelect ? () => onItemSelect(item) : undefined}
        />
      ))}
    </div>
  );
}
