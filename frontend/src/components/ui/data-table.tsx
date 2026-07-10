import { useState, useMemo, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Checkbox } from "./checkbox";

function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  if (direction === "asc") return <ChevronUp className="ml-1 size-3.5" />;
  if (direction === "desc") return <ChevronDown className="ml-1 size-3.5" />;
  return <ChevronsUpDown className="ml-1 size-3.5 text-faint" />;
}

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  header: string;
  /** Accessor function or key path */
  accessor: keyof T | ((row: T) => ReactNode);
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (value: unknown, row: T) => ReactNode;
  /** Column width (Tailwind class) */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  /** Data rows */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Unique key for each row */
  rowKey: keyof T | ((row: T) => string);
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string>;
  /** Selection change callback */
  onSelectionChange?: (selectedKeys: Set<string>) => void;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional class names */
  className?: string;
  /** Sticky header */
  stickyHeader?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available",
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const getRowKey = (row: T): string =>
    typeof rowKey === "function" ? rowKey(row) : String(row[rowKey]);

  const getCellValue = (row: T, column: Column<T>): unknown =>
    typeof column.accessor === "function" ? column.accessor(row) : row[column.accessor];

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aVal = getCellValue(a, column);
      const bVal = getCellValue(b, column);
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columns, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange?.(checked ? new Set(data.map((row) => getRowKey(row))) : new Set());
  };

  const handleRowSelect = (key: string, checked: boolean) => {
    const newSelection = new Set(selectedKeys);
    if (checked) newSelection.add(key);
    else newSelection.delete(key);
    onSelectionChange?.(newSelection);
  };

  const allSelected = data.length > 0 && selectedKeys.size === data.length;
  const someSelected = selectedKeys.size > 0 && selectedKeys.size < data.length;

  const alignClass = (align?: Column<T>["align"]) =>
    cn(align === "center" && "text-center", align === "right" && "text-right");

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-card")}>
          <tr className="border-b border-border">
            {selectable && (
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={someSelected ? "indeterminate" : allSelected}
                  onCheckedChange={(v) => handleSelectAll(v === true)}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wider text-faint",
                  column.width,
                  alignClass(column.align),
                  column.sortable && "cursor-pointer select-none transition-colors hover:text-foreground"
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div
                  className={cn(
                    "inline-flex items-center",
                    column.align === "center" && "justify-center",
                    column.align === "right" && "justify-end"
                  )}
                >
                  {column.header}
                  {column.sortable && (
                    <SortIcon direction={sortKey === column.key ? sortDirection : null} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-border">
                {selectable && (
                  <td className="px-4 py-4">
                    <div className="size-4 animate-pulse rounded bg-elevated" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4">
                    <div className="h-4 w-3/5 animate-pulse rounded bg-elevated" />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => {
              const key = getRowKey(row);
              const isSelected = selectedKeys.has(key);

              return (
                <tr
                  key={key}
                  className={cn(
                    "border-b border-border transition-colors duration-150",
                    isSelected && "bg-primary/5",
                    onRowClick && "cursor-pointer",
                    "hover:bg-elevated/50"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(v) => handleRowSelect(key, v === true)}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = getCellValue(row, column);
                    const rendered = column.render
                      ? column.render(value, row)
                      : (value as ReactNode);

                    return (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-4 tabular-nums",
                          column.align === "right" && "font-mono",
                          alignClass(column.align)
                        )}
                      >
                        {rendered}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = useMemo(() => {
    const result: (number | "...")[] = [];
    const delta = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        result.push(i);
      } else if (result[result.length - 1] !== "...") {
        result.push("...");
      }
    }
    return result;
  }, [currentPage, totalPages]);

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft />
        Previous
      </Button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 font-mono text-faint">
            …
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "primary" : "ghost"}
            size="icon"
            className="size-8 font-mono text-sm tnum"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight />
      </Button>
    </div>
  );
}

export default DataTable;
