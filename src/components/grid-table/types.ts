import type { ReactNode } from "react";

export type GridTableColumn<T> = {
  id: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  align?: "left" | "right";
  renderCell: (row: T) => ReactNode;
};

export type GridTableProps<T> = {
  columns: GridTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  gridTemplateColumns: string;
  className?: string;
  headerRowClassName?: string;
  bodyRowClassName?: string;
  minWidth?: string;
  ariaLabel?: string;
  onRowClick?: (row: T) => void;
  getRowAriaLabel?: (row: T) => string;
};
