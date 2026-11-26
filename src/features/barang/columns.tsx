import { JumlahCell, RupiahCell, StatusBadge } from '../../components/data-table/cells'
import { columnHelperFor } from '../../components/data-table/table-features'
import type { BarangRow } from './queries'

const col = columnHelperFor<BarangRow>()

export function barangColumns(admin = false, actions?: (row: BarangRow) => React.ReactNode) {
  const columns = col.columns([
    { accessorKey: 'nama', header: 'Nama barang', meta: { mobilePriority: 'judul' } },
    { accessorKey: 'satuan', header: 'Satuan', meta: { mobilePriority: 'detail' } },
    {
      accessorKey: 'hargaJual',
      header: 'Harga jual',
      cell: (info) => <RupiahCell value={info.getValue<number>()} />,
      meta: { mobilePriority: 'detail' },
    },
    {
      accessorKey: 'stok',
      header: 'Stok',
      cell: (info) => {
        const row = info.row.original
        return <JumlahCell value={row.stok / 10} unit={row.satuan} />
      },
      meta: { mobilePriority: 'detail' },
    },
  ])
  if (admin)
    columns.push(
      col.accessor('aktif', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue<boolean>() ? 'aktif' : 'nonaktif'} />,
        meta: { mobilePriority: 'detail' },
      }),
    )
  if (admin && actions)
    columns.push(
      col.display({
        id: 'aksi',
        header: 'Aksi',
        cell: (info) => actions(info.row.original),
        meta: { mobilePriority: 'detail' },
      }),
    )
  return columns
}
