import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table'

export type MobilePriority = 'judul' | 'detail' | 'sembunyi'

export type DataTableColumnMeta = {
  mobilePriority?: MobilePriority
}

// Semua fitur tabel didaftarkan sekali agar setiap tabel memakai konfigurasi yang sama.
// Pencarian tetap dilakukan di luar tabel melalui parameter URL.
export const dataTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  columnMeta: {} as DataTableColumnMeta,
})
export type DataTableFeatures = typeof dataTableFeatures

export const columnHelperFor = <TData extends Record<string, any>>() =>
  createColumnHelper<DataTableFeatures, TData>()
