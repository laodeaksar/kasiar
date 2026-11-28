import type { ReactTable, RowData } from "@tanstack/react-table";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { DataTableFeatures } from "./table-features";

type DataTablePaginationProps<T extends RowData> = {
  table: ReactTable<DataTableFeatures, T>;
  total: number;
};

export function DataTablePagination<T extends RowData>({
  table,
  total,
}: DataTablePaginationProps<T>) {
  const { pageIndex, pageSize } = table.state.pagination;
  const page = pageIndex + 1;
  const pages = Math.max(1, table.getPageCount());
  const first = total ? pageIndex * pageSize + 1 : 0;
  const last = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3"
      aria-label="Paginasi daftar"
    >
      <p className="text-sm">
        {first} sampai {last} dari {total}
      </p>
      <div className="join">
        <button
          className="btn btn-sm join-item"
          aria-label="Halaman sebelumnya"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span
          className="btn btn-sm join-item"
          aria-current="page"
        >
          {page} / {pages}
        </span>
        <button
          className="btn btn-sm join-item"
          aria-label="Halaman berikutnya"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}
