import { columnVisibilityFeature, tableFeatures } from '@tanstack/react-table'

export type MobilePriority = 'judul' | 'detail' | 'sembunyi'

export type DataTableColumnMeta = {
  mobilePriority?: MobilePriority
}

export const dataTableFeatures = tableFeatures({
  columnVisibilityFeature,
  columnMeta: {} as DataTableColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures
