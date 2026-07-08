"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import {
  PaginationFirstIcon,
  PaginationLastIcon,
  PaginationNextIcon,
  PaginationPreviousIcon,
} from "./pagination-icons";

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** When false, label shows only the current page and Last is hidden. */
  showTotalPages?: boolean;
  /** Used for Next disabled state when showTotalPages is false. */
  hasMore?: boolean;
};

function PaginationNavButton({
  label,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center text-[#909090] transition-opacity",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:opacity-70",
        className,
      )}
    >
      {children}
    </button>
  );
}

function CompactPagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  showTotalPages = true,
  hasMore = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrevious = page > 1;
  const canGoNext = showTotalPages ? page < totalPages : hasMore;
  const canGoFirst = page > 1;
  const canGoLast = showTotalPages && page < totalPages;

  // if (total <= pageSize) {
  //   return null;
  // }

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex items-center justify-end gap-3 px-[30px] py-4",
        className,
      )}
    >
      <PaginationNavButton
        label="First page"
        disabled={!canGoFirst}
        onClick={() => onPageChange(1)}
      >
        <PaginationFirstIcon />
      </PaginationNavButton>

      <PaginationNavButton
        label="Previous page"
        disabled={!canGoPrevious}
        onClick={() => onPageChange(page - 1)}
      >
        <PaginationPreviousIcon />
      </PaginationNavButton>

      <span className="text-[12px] leading-[normal] text-[#909090]">
        {showTotalPages ? `Page ${page} / ${totalPages}` : `Page ${page}`}
      </span>

      <PaginationNavButton
        label="Next page"
        disabled={!canGoNext}
        onClick={() => onPageChange(page + 1)}
      >
        <PaginationNextIcon />
      </PaginationNavButton>

      {showTotalPages ? (
        <PaginationNavButton
          label="Last page"
          disabled={!canGoLast}
          onClick={() => onPageChange(totalPages)}
        >
          <PaginationLastIcon />
        </PaginationNavButton>
      ) : null}
    </nav>
  );
}

export function Pagination({
  ...props
}: PaginationProps) {
  return <CompactPagination {...props} />;
}
