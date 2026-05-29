"use client";

import { cn } from "@/lib/cn";

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  if (total <= pageSize) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-3 py-4 md:px-5",
        className
      )}
    >
      <button
        type="button"
        className={cn(
          "rounded-[8px] border border-[#EBEBEB] bg-white px-3 py-2 text-[14px] font-[457] leading-[17px] text-black transition-colors",
          canGoPrevious
            ? "hover:border-[#D8D8D8]"
            : "cursor-not-allowed text-[#C0C0C0]"
        )}
        disabled={!canGoPrevious}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>

      <span className="text-[14px] font-[457] leading-[17px] text-[#909090]">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        className={cn(
          "rounded-[8px] border border-[#EBEBEB] bg-white px-3 py-2 text-[14px] font-[457] leading-[17px] text-black transition-colors",
          canGoNext
            ? "hover:border-[#D8D8D8]"
            : "cursor-not-allowed text-[#C0C0C0]"
        )}
        disabled={!canGoNext}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
