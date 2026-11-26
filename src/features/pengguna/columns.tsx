import { columnHelperFor } from '../../components/data-table/table-features'
import type { KasirRow } from './queries'

const col = columnHelperFor<KasirRow>()

export function penggunaColumns(action: (row: KasirRow) => React.ReactNode) {
  return col.columns([
    { accessorKey: 'username', header: 'Username', meta: { mobilePriority: 'judul' } },
    {
      accessorKey: 'createdAt',
      header: 'Dibuat',
      cell: (info) => new Date(info.getValue<string>()).toLocaleDateString('id-ID'),
      meta: { mobilePriority: 'detail' },
    },
    col.display({
      id: 'aksi',
      header: 'Aksi',
      cell: (info) => action(info.row.original),
      meta: { mobilePriority: 'detail' },
    }),
  ])
}
