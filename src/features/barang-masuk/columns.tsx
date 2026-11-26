import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableFeatures } from '../../components/data-table/table-features'
import { JumlahCell, RupiahCell, TanggalCell } from '../../components/data-table/cells'
import type { BarangMasukRow } from './queries'

export function barangMasukColumns(): ColumnDef<DataTableFeatures, BarangMasukRow, unknown>[] {
  return [
    {
      accessorKey: 'tanggal',
      header: 'Tanggal',
      cell: (info) => <TanggalCell value={info.getValue<string>()} />,
      meta: { mobilePriority: 'detail' },
    },
    { accessorKey: 'namaBarang', header: 'Barang', meta: { mobilePriority: 'judul' } },
    {
      accessorKey: 'jumlahPersepuluh',
      header: 'Jumlah',
      cell: (info) => {
        const row = info.row.original
        return <JumlahCell value={row.jumlahPersepuluh / 10} unit={row.satuan} />
      },
      meta: { mobilePriority: 'detail' },
    },
    {
      accessorKey: 'hargaBeli',
      header: 'Harga beli',
      cell: (info) => <RupiahCell value={info.getValue<number>()} />,
      meta: { mobilePriority: 'detail' },
    },
    {
      accessorKey: 'pemasok',
      header: 'Pemasok',
      cell: (info) => info.getValue<string | null>() || '—',
      meta: { mobilePriority: 'detail' },
    },
    { accessorKey: 'namaPengguna', header: 'Dicatat oleh', meta: { mobilePriority: 'sembunyi' } },
  ]
}
