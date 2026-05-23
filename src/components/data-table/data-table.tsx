import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from '@heroui/table';

import { ReactNode, ReactElement, useMemo, useState } from 'react';
import { ArrowDownUp, ChevronDown, ChevronUp } from 'lucide-react';

type TableColumn<Entry> = {
  key?: string;
  title: string;
  field: keyof Entry | string;
  Cell?({ entry }: { entry: Entry }): ReactElement | ReactNode;
  sortable?: boolean;
  sortAccessor?: (entry: Entry) => string | number | null | undefined;
};

type SortDirection = "asc" | "desc";

export type Column<T> = TableColumn<T>;

export type DataTableProps<Entry extends { id: string | number }> = {
  data: Entry[];
  columns: TableColumn<Entry>[];
};

export function DataTable<Entry extends { id: string | number }>({
  data,
  columns,
}: DataTableProps<Entry>) {
  const [sortState, setSortState] = useState<{
    field: string;
    direction: SortDirection;
  } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortState) return data;

    const activeColumn = columns.find(
      (column) => String(column.field) === sortState.field,
    );

    if (!activeColumn) return data;

    const getComparableValue = (value: string | number | null | undefined) => {
      if (value === null || value === undefined || value === "") return null;

      if (typeof value === "number") return value;

      const normalizedValue = String(value).trim();
      const parsedValue = Number(normalizedValue);

      if (normalizedValue !== "" && Number.isFinite(parsedValue)) {
        return parsedValue;
      }

      return normalizedValue.toLocaleLowerCase();
    };

    return [...data].sort((leftEntry, rightEntry) => {
      const leftValue = getComparableValue(
        activeColumn.sortAccessor?.(leftEntry) ??
          (leftEntry[activeColumn.field as keyof Entry] as string | number | null | undefined),
      );
      const rightValue = getComparableValue(
        activeColumn.sortAccessor?.(rightEntry) ??
          (rightEntry[activeColumn.field as keyof Entry] as string | number | null | undefined),
      );

      if (leftValue === null && rightValue === null) return 0;
      if (leftValue === null) return 1;
      if (rightValue === null) return -1;

      if (leftValue < rightValue) {
        return sortState.direction === "asc" ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortState.direction === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [columns, data, sortState]);

  const handleSortChange = (field: string) => {
    setSortState((currentSort) => {
      if (currentSort?.field === field) {
        return {
          field,
          direction: currentSort.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        field,
        direction: "asc",
      };
    });
  };

  return (
      <Table classNames={{ wrapper: "glass-card" }}>
        <TableHeader>
          {columns.map((column, index) => (
            <TableColumn
              key={column.key || String(column.field) || index}
            >
              {column.sortable ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-inherit"
                  onClick={() => handleSortChange(String(column.field))}
                >
                  <span>{column.title}</span>
                  {sortState?.field === String(column.field) ? (
                    sortState.direction === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowDownUp className="h-4 w-4 opacity-60" />
                  )}
                </button>
              ) : (
                column.title
              )}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent={"No rows to display."}>
          {sortedData.map((item) => (
            <TableRow key={item.id}>
              {columns.map((column, colIndex) => (
                <TableCell key={column.key || String(column.field) || colIndex}>
                  {column.Cell ? (
                    <column.Cell entry={item} />
                  ) : (
                    `${item[column.field as keyof Entry]}`
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
