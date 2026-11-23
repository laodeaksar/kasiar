import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Form, useField, useForm } from '@formisch/react'
import * as v from 'valibot'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { useConfirm } from '../../components/confirm/confirm-provider'
import { DataTable, DataTablePagination, DataTableSearch, DataTableStates, DataTableToolbar, JumlahCell, RupiahCell, StatusBadge, TanggalCell } from '../../components/data-table'
import { EmptyState, ErrorState, Skeleton } from '../../components/feedback'
import { DateField, FormAlert, FormSubmitButton, NumberField, PasswordField, RupiahField, SelectField, TextField } from '../../components/form'
import { useToast } from '../../components/toast/toast-provider'
import type { ListResponse } from '../../types/api'

export const Route = createFileRoute('/_app/uji-komponen')({ beforeLoad: () => { if (!import.meta.env.DEV) throw notFound() }, component: ComponentTestPage })
const DemoSchema = v.object({ nama: v.pipe(v.string(), v.minLength(1, 'Nama wajib diisi.')), password: v.string(), jumlah: v.number(), harga: v.number(), satuan: v.string(), tanggal: v.string() })
type ExampleRow = { name: string; count: number; price: number; date: string; status: string }
const exampleRows: ExampleRow[] = [
  { name: 'Contoh: Beras eceran', count: 2.5, price: 18000, date: '2026-11-23', status: 'aktif' },
  { name: 'Contoh: Telur', count: 12, price: 30000, date: '2026-11-22', status: 'lunas' },
]
const columns: ColumnDef<ExampleRow, unknown>[] = [
  { accessorKey: 'name', header: 'Nama contoh', cell: (ctx) => ctx.getValue(), meta: { mobilePriority: 'judul' } },
  { accessorKey: 'count', header: 'Jumlah', cell: (ctx) => <JumlahCell value={ctx.getValue<number>()} unit="kg"/>, meta: { mobilePriority: 'detail' } },
  { accessorKey: 'price', header: 'Harga contoh', cell: (ctx) => <RupiahCell value={ctx.getValue<number>()}/>, meta: { mobilePriority: 'detail' } },
  { accessorKey: 'date', header: 'Tanggal', cell: (ctx) => <TanggalCell value={ctx.getValue<string>()}/>, meta: { mobilePriority: 'sembunyi' } },
  { accessorKey: 'status', header: 'Status', cell: (ctx) => <StatusBadge status={ctx.getValue<string>()}/>, meta: { mobilePriority: 'detail' } },
]

function ComponentTestPage() {
  return <div className="space-y-8">
    <header className="space-y-2"><p className="badge badge-primary badge-outline">Khusus mode pengembangan</p><h1 className="text-3xl font-bold">Uji komponen bersama</h1><p>Contoh data di halaman ini hanya untuk uji tampilan, bukan data toko.</p></header>
    <ActionSamples/><FormSamples/><FeedbackSamples/><TableSamples/>
  </div>
}
function ActionSamples() {
  const confirm = useConfirm(); const { showToast } = useToast()
  return <section className="card border border-base-300 bg-base-100"><div className="card-body"><h2 className="card-title">Konfirmasi dan notifikasi</h2><p>Coba tombol-tombol ini untuk melihat perilaku pesan.</p><div className="flex flex-wrap gap-3"><button className="btn btn-primary min-h-12" onClick={async () => { if (await confirm({ title: 'Yakin?', message: 'Ini contoh konfirmasi untuk pengujian.' })) showToast('sukses', 'Contoh berhasil dikonfirmasi.') }}>Coba konfirmasi</button><button className="btn btn-success min-h-12" onClick={() => showToast('sukses', 'Contoh notifikasi sukses.')}>Toast sukses</button><button className="btn btn-warning min-h-12" onClick={() => showToast('peringatan', 'Contoh notifikasi peringatan.')}>Toast peringatan</button><button className="btn btn-error min-h-12" onClick={() => showToast('error', 'Contoh notifikasi error.')}>Toast error</button></div></div></section>
}
function FormSamples() {
  const form = useForm({ schema: DemoSchema, initialInput: { nama: '', password: '', jumlah: 2.5, harga: 12500, satuan: 'kg', tanggal: '2026-11-23' } })
  const nama = useField(form, { path: ['nama'] }); const password = useField(form, { path: ['password'] }); const jumlah = useField(form, { path: ['jumlah'] }); const harga = useField(form, { path: ['harga'] }); const satuan = useField(form, { path: ['satuan'] }); const tanggal = useField(form, { path: ['tanggal'] })
  return <section className="card border border-base-300 bg-base-100"><div className="card-body"><h2 className="card-title">Isian form (contoh)</h2><Form of={form} onSubmit={() => undefined} className="grid gap-4 sm:grid-cols-2"><TextField field={nama} label="Nama contoh" required hint="Label tetap terlihat."/><PasswordField field={password} label="Password contoh" showStrength/><NumberField field={jumlah} label="Jumlah contoh" decimals={1} hint="Untuk kg, satu angka desimal."/><RupiahField field={harga} label="Harga contoh"/><SelectField field={satuan} label="Satuan contoh" options={[{ value: 'kg', label: 'Kilogram (kg)' }, { value: 'pcs', label: 'Buah (pcs)' }]}/><DateField field={tanggal} label="Tanggal contoh"/><div className="sm:col-span-2"><FormAlert message="Pesan gagal dari form akan terlihat seperti ini."/><div className="mt-3"><FormSubmitButton>Uji tombol simpan</FormSubmitButton></div></div></Form></div></section>
}
function FeedbackSamples() {
  return <section className="space-y-4"><h2 className="text-2xl font-bold">Umpan balik</h2><div className="grid gap-4 lg:grid-cols-2"><div className="card border border-base-300 bg-base-100"><div className="card-body"><h3 className="font-bold">Kerangka memuat</h3><Skeleton variant="table-rows" count={3}/></div></div><div className="card border border-base-300 bg-base-100"><div className="card-body"><h3 className="font-bold">Kerangka kartu ponsel</h3><Skeleton variant="cards" count={2}/></div></div><div className="card border border-base-300 bg-base-100"><div className="card-body"><h3 className="font-bold">Kerangka teks dan form</h3><Skeleton variant="text" count={2}/><Skeleton variant="form" count={2}/></div></div><EmptyState title="Belum ada barang." description="Hubungi admin untuk menambahkan barang."/><EmptyState title="Tidak ada hasil untuk “contoh”." searching action={<button className="btn btn-outline">Hapus pencarian</button>}/><ErrorState onRetry={() => undefined}/></div></section>
}
function TableSamples() {
  const [query, setQuery] = useState(''); const [page, setPage] = useState(1)
  const filteredRows = exampleRows.filter((row) => row.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const pageSize = 1
  const data: ListResponse<ExampleRow> = { rows: filteredRows.slice((page - 1) * pageSize, page * pageSize), total: filteredRows.length, page, pageSize }
  return <section className="card border border-base-300 bg-base-100"><div className="card-body"><h2 className="card-title">Daftar contoh</h2><p>Desktop menampilkan tabel, layar HP menampilkan kartu.</p><DataTableToolbar><DataTableSearch value={query} onChange={(value: string) => { setQuery(value); setPage(1) }}/></DataTableToolbar><DataTable columns={columns} data={data} caption="Daftar contoh untuk pengujian"/><DataTablePagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage}/><DataTableStates isEmpty={data.rows.length === 0} isSearchEmpty={query !== '' && data.rows.length === 0} query={query} onClearSearch={() => setQuery('')}/></div></section>
}
