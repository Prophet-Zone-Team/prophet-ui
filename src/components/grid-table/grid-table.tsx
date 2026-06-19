import type { KeyboardEvent } from "react";

import { cn } from "@/lib/cn";

import type { GridTableProps } from "./types";

export function GridTable<T>({
  columns,
  rows,
  getRowKey,
  gridTemplateColumns,
  className,
  headerRowClassName,
  bodyRowClassName,
  minWidth = "930px",
  ariaLabel,
  onRowClick,
  getRowAriaLabel,
}: GridTableProps<T>) {
  function handleRowKeyDown(row: T, event: KeyboardEvent<HTMLDivElement>) {
    if (!onRowClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row);
    }
  }
  const gridStyle = { gridTemplateColumns };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div
        role="table"
        aria-label={ariaLabel}
        className="w-full"
        style={{ minWidth }}
      >
        <div
          role="row"
          className={cn(
            "grid gap-x-4 px-[30px] pb-2 text-[14px] leading-[normal] text-[#909090]",
            headerRowClassName,
          )}
          style={gridStyle}
        >
          {columns.map((column) => (
            <span
              key={column.id}
              role="columnheader"
              className={cn(
                column.align === "right" && "text-right",
                column.headerClassName,
              )}
            >
              {column.header}
            </span>
          ))}
        </div>

        <div className="flex flex-col border-b border-[#EBEBEB]">
          {rows.map((row) => (
            <div
              key={getRowKey(row)}
              role={onRowClick ? "button" : "row"}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick ? getRowAriaLabel?.(row) : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick ? (event) => handleRowKeyDown(row, event) : undefined
              }
              className={cn(
                "grid gap-x-4 px-[30px] py-[19px] text-[14px] leading-[normal] text-black last:border-b-0",
                onRowClick && "cursor-pointer",
                bodyRowClassName,
              )}
              style={gridStyle}
            >
              {columns.map((column) => (
                <span
                  key={column.id}
                  role="cell"
                  className={cn(
                    "min-w-0 truncate",
                    column.align === "right" && "text-right",
                    column.cellClassName,
                  )}
                >
                  {column.renderCell(row)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
