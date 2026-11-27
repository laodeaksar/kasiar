import type { ColumnDef, PaginationState, RowData } from "@tanstack/react-table";

import { useTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

import type { ListResponse } from "~/types/api";

import type { DataTableFeatures } from "./table-features";

import { DataTablePagination } from "./pagination";
import { dataTableFeatures } from "./table-features";

type TableColumn<T extends RowData> = ColumnDef<DataTableFeatures, T, unknown>;

type DataTableProps<T extends RowData> = {
  columns: TableColumn<T>[];
  data: ListResponse<T>;
  caption: string;
  rowKey?: (row: T, index: number) => string;
  onPageChange?: (page: number) => void;
};

export function DataTable<T extends RowData>({
  columns,
  data,
  caption,
  rowKey,
  onPageChange,
}: DataTableProps<T>) {
  const pagination: PaginationState = {
    pageIndex: data.page - 1,
    pageSize: data.pageSize,
  };
  
  const table = useTable({
    features: dataTableFeatures,
    data: data.rows,
    columns,
    state: { pagination },
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(data.total / data.pageSize)),
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      onPageChange?.(next.pageIndex + 1);
    },
  });
  
  const rows = table.getRowModel().rows;
  if (rows.length === 0) return null;
  
  return (
    <>
      <div
        className="space-y-3 md:hidden"
        aria-label={caption}
      >
        {rows.map((row, index) => {
          const cells = row.getVisibleCells();
          const heading =
            cells.find((cell) => cell.column.columnDef.meta?.mobilePriority === "judul") ??
            cells[0];
          return (
            <article
              key={rowKey?.(row.original, index) ?? row.id}
              className="card border border-base-300 bg-base-100"
            >
              <div className="card-body gap-2 p-4">
                <h3 className="card-title text-base">
                  {flexRender(heading.column.columnDef.cell, heading.getContext())}
                </h3>
                {cells
                  .filter(
                    (cell) =>
                      cell.id !== heading.id &&
                      cell.column.columnDef.meta?.mobilePriority !== "sembunyi",
                  )
                  .map((cell) => (
                    <div
                      key={cell.id}
                      className="flex flex-wrap justify-between gap-2 border-t border-base-300 pt-2 text-sm"
                    >
                      <span className="font-medium">
                        {String(cell.column.columnDef.header ?? "")}
                      </span>
                      <span>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                    </div>
                  ))}
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto rounded-box border border-base-300 md:block">
        <table className="table table-zebra">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {table
                .getHeaderGroups()
                .map((group) =>
                  group.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )),
                )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <DataTablePagination
          table={table}
          total={data.total}
        />
      )}
    </>
  );
}
