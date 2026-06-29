import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

const Table = <T extends Record<string, unknown>>({
  data,
  columns,
  isLoading,
  emptyMessage,
  className,
  onRowClick,
}: TableProps<T>) => {
  const { t } = useTranslation();
  const displayEmptyMessage = emptyMessage || t("ui.noData", "No data available");
  if (isLoading) {
    return (
      <div className="w-full">
        <table className={cn("w-full caption-bottom text-sm", className)}>
          <thead>
            <tr className="border-b">
              {columns.map((_col, i) => (
                <th
                  key={i}
                  className="h-12 px-4 align-middle font-medium"
                >
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b">
                {columns.map((_, j) => (
                  <td key={j} className="p-4">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        {displayEmptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>
        <thead>
          <tr className="border-b">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "border-b transition-colors hover:bg-muted/50",
                onRowClick && "cursor-pointer",
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIndex) => {
                const value = row[col.key as keyof T];
                return (
                  <td
                    key={colIndex}
                    className={cn("p-4 align-middle", col.className)}
                  >
                    {col.render ? col.render(value, row) : String(value || "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

Table.displayName = "Table";

export { Table };
