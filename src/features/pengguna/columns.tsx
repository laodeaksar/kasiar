import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import type { KasirRow } from './queries'
export function penggunaColumns(action: (row: KasirRow) => React.ReactNode): ColumnDef<KasirRow, unknown>[] {
  return [
    { accessorKey: 'username', header: 'Username', meta: { mobilePriority: 'judul' } },
    { accessorKey: 'createdAt', header: 'Dibuat', cell: (info) => new Date(info.getValue<string>()).toLocaleDateString('id-ID'), meta: { mobilePriority: 'detail' } },
    { id: 'aksi', header: 'Aksi', cell: (info) => action(info.row.original), meta: { mobilePriority: 'detail' } },
  ]
}
