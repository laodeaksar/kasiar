import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { JumlahCell, RupiahCell, StatusBadge } from '../../components/data-table/cells'
import type { BarangRow } from './queries'
export function barangColumns(admin = false, actions?: (row: BarangRow) => React.ReactNode): ColumnDef<BarangRow, unknown>[] {
  const columns: ColumnDef<BarangRow, unknown>[] = [
    { accessorKey: 'nama', header: 'Nama barang', meta: { mobilePriority: 'judul' } },
    { accessorKey: 'satuan', header: 'Satuan', meta: { mobilePriority: 'detail' } },
    { accessorKey: 'hargaJual', header: 'Harga jual', cell: (info) => <RupiahCell value={info.getValue<number>()} />, meta: { mobilePriority: 'detail' } },
    { accessorKey: 'stok', header: 'Stok', cell: (info) => { const row = info.row.original; return <JumlahCell value={row.stok / 10} unit={row.satuan} /> }, meta: { mobilePriority: 'detail' } },
  ]
  if (admin) columns.push({ accessorKey: 'aktif', header: 'Status', cell: (info) => <StatusBadge status={info.getValue<boolean>() ? 'aktif' : 'nonaktif'} />, meta: { mobilePriority: 'detail' } })
  if (admin && actions) columns.push({ id: 'aksi', header: 'Aksi', cell: (info) => actions(info.row.original), meta: { mobilePriority: 'detail' } })
  return columns
}
