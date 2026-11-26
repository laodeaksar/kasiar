import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Form, useField, useForm } from '@formisch/react'
import * as v from 'valibot'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { useConfirm } from '../../components/confirm/confirm-provider'
import { DataTable, DataTablePagination, DataTableSearch, DataTableStates, DataTableToolbar, JumlahCell, RupiahCell, StatusBadge, TanggalCell } from '../../components/data-table'
import { EmptyState, ErrorState, Skeleton } from '../../components/feedback'
import { DateField, FormAlert, FormSubmitButton, NumberField, PasswordField, RupiahField, SelectField, TextField } from '../../components/form'
import { Modal, ModalBody, ModalFooter, useModalClose } from '../../components/modal'
import { PageHeader } from '../../components/page-header'
import { PageHeaderSamples } from '../../components/page-header/page-header-samples'
import { PasswordRequirementsSamples } from '../../components/form/password-requirements-samples'
import { toast } from '../../components/toast/toast-store'
import { MutationQuerySample } from '../../features/contoh/mutation-query-sample'
import { healthQueryOptions } from '../../features/contoh/queries'
import type { ListResponse } from '../../types/api'

export const Route = createFileRoute('/_app/uji-komponen')({
  beforeLoad: () => { if (!import.meta.env.DEV) throw notFound() },
  loader: ({ context }) => context.queryClient.ensureQueryData(healthQueryOptions()),
  component: ComponentTestPage,
})
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
type ModalKind = 'kecil' | 'sedang' | 'besar' | 'panjang' | 'form'

function ComponentTestPage() {
  return <div className="space-y-8">
    <div className="space-y-2"><p className="badge badge-primary badge-outline">Khusus mode pengembangan</p><PageHeader title="Uji komponen bersama" description="Contoh tampilan ini hanya untuk pengujian, bukan data toko."/></div>
    <PageHeaderSamples/><MutationQuerySample/><PasswordRequirementsSamples/><ModalSamples/><ActionSamples/><FormSamples/><FeedbackSamples/><TableSamples/>
  </div>
}

function ModalSamples() {
  const [kind, setKind] = useState<ModalKind | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const title = kind === 'kecil' ? 'Modal kecil' : kind === 'sedang' ? 'Modal sedang' : kind === 'besar' ? 'Modal besar' : kind === 'panjang' ? 'Isi panjang' : 'Form dengan penjaga'
  const size = kind === 'kecil' ? 'kecil' : kind === 'besar' || kind === 'panjang' ? 'besar' : 'sedang'

  return <section className="space-y-4 rounded-box border border-base-300 p-4 sm:p-6">
    <div><h2 className="text-2xl font-bold">Modal responsif</h2><p className="mt-1">Di HP, tiap modal menjadi bottom sheet; mulai lebar 640 px, tampil di tengah. Coba juga Esc dan ketuk/klik latar.</p></div>
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-outline min-h-11" onClick={() => setKind('kecil')}>Buka kecil</button>
      <button className="btn btn-outline min-h-11" onClick={() => setKind('sedang')}>Buka sedang</button>
      <button className="btn btn-outline min-h-11" onClick={() => setKind('besar')}>Buka besar</button>
      <button className="btn btn-outline min-h-11" onClick={() => setKind('panjang')}>Coba isi bergulir</button>
      <button className="btn btn-primary min-h-11" onClick={() => setKind('form')}>Coba form dan konfirmasi bertumpuk</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div data-theme="light" className="rounded-box border border-base-300 bg-base-100 p-4 text-base-content"><strong>Tema terang</strong><p className="mt-1">Pratinjau token latar, teks, dan batas.</p><div className="mt-3 h-2 rounded bg-primary"/></div>
      <div data-theme="dark" className="rounded-box border border-base-300 bg-base-100 p-4 text-base-content"><strong>Tema gelap</strong><p className="mt-1">Pratinjau token latar, teks, dan batas.</p><div className="mt-3 h-2 rounded bg-primary"/></div>
    </div>
    <p className="text-sm text-base-content/70">Tema untuk modal yang dibuka sekarang: <strong>{theme === 'light' ? 'terang' : 'gelap'}</strong></p>
    <div data-theme={theme}>
      {kind === 'form' ? <DirtyModalSample theme={theme} onClose={() => setKind(null)}/> : kind && <Modal open onClose={() => setKind(null)} title={title} size={size}>
        <ModalBody>{kind === 'panjang' ? <LongModalContent/> : <p>Contoh isi modal. Coba menutupnya lewat tombol X, tombol Escape, atau latar.</p>}</ModalBody>
        <ModalFooter><button type="button" className="btn btn-primary min-h-11" data-modal-action="true" onClick={() => setKind(null)}>Selesai</button></ModalFooter>
      </Modal>}
    </div>
    <div className="flex flex-wrap gap-2">
      <button className={`btn min-h-11 ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('light')}>Uji modal tema terang</button>
      <button className={`btn min-h-11 ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('dark')}>Uji modal tema gelap</button>
    </div>
  </section>
}

function LongModalContent() {
  return <div className="space-y-4">
    <p>Bagian isi inilah yang bergulir sendiri. Judul dan tombol di bawah tetap terlihat.</p>
    {Array.from({ length: 18 }, (_, index) => <p key={index} className="rounded-box border border-base-300 p-3">Baris contoh {index + 1}: teks panjang untuk menguji gulir badan modal pada layar kecil dan besar.</p>)}
  </div>
}

function DirtyModalSample({ theme, onClose }: { theme: 'light' | 'dark'; onClose: () => void }) {
  const [value, setValue] = useState('Contoh')
  const [saving, setSaving] = useState(false)
  const confirm = useConfirm()
  async function closeGuard() {
    if (value === 'Contoh') return true
    return confirm({ title: 'Buang perubahan?', message: 'Isian yang belum disimpan akan hilang', cancelText: 'Tetap mengedit', confirmText: 'Buang isian', danger: true })
  }
  async function save() {
    setSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 1800))
    setSaving(false)
    onClose()
  }
  return <div data-theme={theme}>
    <Modal open onClose={onClose} title="Form dengan penjaga" size="sedang" closeGuard={closeGuard} canClose={!saving}>
      <DirtyModalFields value={value} saving={saving} onChange={setValue} onSave={() => { void save() }}/>
    </Modal>
  </div>
}

function DirtyModalFields({ value, saving, onChange, onSave }: { value: string; saving: boolean; onChange: (value: string) => void; onSave: () => void }) {
  const close = useModalClose()
  const confirm = useConfirm()
  return <>
    <ModalBody className="space-y-4">
      <label className="form-control"><span className="label-text mb-1">Isian yang berubah</span><input className="input input-bordered min-h-12" value={value} onChange={(event) => onChange(event.target.value)} autoFocus/></label>
      <p className="text-sm text-base-content/70">Ubah teks lalu coba X, Escape, atau latar. Penjaga meminta konfirmasi sebelum membuang perubahan.</p>
      <button type="button" className="btn btn-outline min-h-11" onClick={async () => { await confirm({ title: 'Konfirmasi di atas form', message: 'Dialog ini tampil di atas modal form untuk menguji tumpukan.' }) }}>Buka konfirmasi bertumpuk</button>
      {saving && <p role="status" className="alert alert-info">Sedang menyimpan… Penutupan dinonaktifkan sementara.</p>}
    </ModalBody>
    <ModalFooter>
      <button type="button" className="btn btn-ghost min-h-11" disabled={saving} onClick={close}>Batal</button>
      <button type="button" className="btn btn-primary min-h-11" disabled={saving} onClick={onSave}>{saving ? 'Menyimpan…' : 'Simpan (1,8 detik)'}</button>
    </ModalFooter>
  </>
}

function ActionSamples() {
  const confirm = useConfirm()
  return <section className="card border border-base-300 bg-base-100"><div className="card-body"><h2 className="card-title">Konfirmasi dan notifikasi</h2><p>Coba tombol-tombol ini untuk melihat perilaku pesan.</p><div className="flex flex-wrap gap-3"><button className="btn btn-primary min-h-12" onClick={async () => { if (await confirm({ title: 'Yakin?', message: 'Ini contoh konfirmasi untuk pengujian.' })) toast.success('Contoh berhasil dikonfirmasi.') }}>Coba konfirmasi</button><button className="btn btn-success min-h-12" onClick={() => toast.success('Contoh notifikasi sukses.')}>Toast sukses</button><button className="btn btn-warning min-h-12" onClick={() => toast.warning('Contoh notifikasi peringatan.')}>Toast peringatan</button><button className="btn btn-error min-h-12" onClick={() => toast.error('Contoh notifikasi error.')}>Toast error</button></div></div></section>
}

function FormSamples() {
  const form = useForm({ schema: DemoSchema, initialInput: { nama: '', password: '', jumlah: 2.5, harga: 12500, satuan: 'kg', tanggal: '2026-11-23' } })
  const nama = useField(form, { path: ['nama'] })
  const password = useField(form, { path: ['password'] })
  const jumlah = useField(form, { path: ['jumlah'] })
  const harga = useField(form, { path: ['harga'] })
  const satuan = useField(form, { path: ['satuan'] })
  const tanggal = useField(form, { path: ['tanggal'] })
  return <section className="card border border-base-300 bg-base-100"><div className="card-body"><h2 className="card-title">Isian form (contoh)</h2><Form of={form} onSubmit={() => undefined} className="grid gap-4 sm:grid-cols-2"><TextField field={nama} label="Nama contoh" required hint="Label tetap terlihat."/><PasswordField field={password} label="Password contoh" showStrength/><NumberField field={jumlah} label="Jumlah contoh" decimals={1} hint="Untuk kg, satu angka desimal."/><RupiahField field={harga} label="Harga contoh"/><SelectField field={satuan} label="Satuan contoh" options={[{ value: 'kg', label: 'Kilogram (kg)' }, { value: 'pcs', label: 'Buah (pcs)' }]}/><DateField field={tanggal} label="Tanggal contoh"/><div className="sm:col-span-2"><FormAlert message="Pesan gagal dari form akan terlihat seperti ini."/><div className="mt-3"><FormSubmitButton>Uji tombol simpan</FormSubmitButton></div></div></Form></div></section>
}

function FeedbackSamples() {
  return <section className="space-y-4"><h2 className="text-2xl font-bold">Umpan balik</h2><div className="grid gap-4 lg:grid-cols-2"><div className="card border border-base-300 bg-base-100"><div className="card-body"><h3 className="font-bold">Kerangka memuat</h3><Skeleton variant="table-rows" count={3}/></div></div><div className="card border border-base-300 bg-base-100"><div className="card-body"><h3 className="font-bold">Kerangka kartu ponsel</h3><Skeleton variant="cards" count={2}/></div></div><div className="card border border-base-300 bg-base-100"><div className="card-body"><h3 className="font-bold">Kerangka teks dan form</h3><Skeleton variant="text" count={2}/><Skeleton variant="form" count={2}/></div></div><EmptyState title="Belum ada barang." description="Hubungi admin untuk menambahkan barang."/><EmptyState title="Tidak ada hasil untuk “contoh”." searching action={<button className="btn btn-outline">Hapus pencarian</button>}/><ErrorState onRetry={() => undefined}/></div></section>
}

function TableSamples() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const filteredRows = exampleRows.filter((row) => row.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  const pageSize = 1
  const data: ListResponse<ExampleRow> = { rows: filteredRows.slice((page - 1) * pageSize, page * pageSize), total: filteredRows.length, page, pageSize }
  return <section className="card border border-base-300 bg-base-100"><div className="card-body"><h2 className="card-title">Daftar contoh</h2><p>Desktop menampilkan tabel, layar HP menampilkan kartu.</p><DataTableToolbar><DataTableSearch value={query} onChange={(value: string) => { setQuery(value); setPage(1) }}/></DataTableToolbar><DataTable columns={columns} data={data} caption="Daftar contoh untuk pengujian"/><DataTablePagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage}/><DataTableStates isEmpty={data.rows.length === 0} isSearchEmpty={query !== '' && data.rows.length === 0} query={query} onClearSearch={() => setQuery('')}/></div></section>
}
