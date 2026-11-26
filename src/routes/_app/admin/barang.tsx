import { Form, isDirty, reset, useField, useForm } from '@formisch/react'
import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useConfirm } from '../../../components/confirm/use-confirm'
import { DataTable, DataTablePagination, DataTableSearch, DataTableStates, DataTableToolbar } from '../../../components/data-table'
import { EmptyState } from '../../../components/feedback'
import { FormAlert, FormSubmitButton, RupiahField, SelectField, TextField } from '../../../components/form'
import { Modal, ModalBody, ModalFooter, useModalClose } from '../../../components/modal'
import { HeaderButton, PageHeader } from '../../../components/page-header'
import { toast } from '../../../components/toast/toast-store'
import { formatRupiah } from '../../../lib/format'
import { ApiRequestError } from '../../../lib/api'
import { SATUAN_BARANG } from '../../../lib/konstanta'
import { barangColumns } from '../../../features/barang/columns'
import { BarangForm } from '../../../features/barang/barang-form'
import { getBarang, ubahBarang, type BarangRow } from '../../../features/barang/queries'
import { BarangSchema, parseBarangSearch, type BarangInput } from '../../../validation/barang'

const satuanOptions = SATUAN_BARANG.map((value) => ({ value, label: value === 'kg' ? 'Kilogram (kg)' : value }))

export const Route = createFileRoute('/_app/admin/barang')({
  validateSearch: (search) => parseBarangSearch(search),
  loaderDeps: ({ search }) => ({ q: search.q, halaman: search.halaman, status: search.status }),
  loader: ({ deps }) => getBarang(deps, true),
  component: AdminBarangPage,
})

function AdminBarangPage() {
  const data = Route.useLoaderData()
  const isAdmin = Route.useRouteContext().session?.peran === 'admin'
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<BarangRow | null>(null)
  const confirm = useConfirm()
  const changeSearch = (patch: Partial<typeof search>) => navigate({ search: (old) => ({ ...old, ...patch }) })

  async function toggleActive(row: BarangRow) {
    if (row.aktif && !await confirm({ title: 'Yakin?', message: `Nonaktifkan barang “${row.nama}”? Barang nonaktif tidak ditampilkan pada daftar barang.`, confirmText: 'Nonaktifkan', danger: true })) return
    try {
      await ubahBarang(row.id, { aktif: !row.aktif })
      toast.success('Data barang diperbarui.')
      await router.invalidate()
    } catch {
      toast.error('Perubahan barang tidak berhasil. Coba lagi.')
    }
  }

  const columns = barangColumns(true, (row) => <button className="btn btn-sm btn-outline min-h-10" onClick={() => row.aktif ? setEditing(row) : void toggleActive(row)}>{row.aktif ? 'Ubah' : 'Aktifkan'}</button>)
  const empty = data.rows.length === 0
  const searching = Boolean(search.q) && empty

  return <section className="space-y-5">
    <PageHeader title="Kelola Barang" description="Tambah barang dan atur nama, satuan, harga jual, serta statusnya." actions={isAdmin ? <HeaderButton icon={Plus} label="Tambah barang" variant="utama" onClick={() => setShowAdd(true)}/> : undefined}/>
    {showAdd && <BarangForm onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); void router.invalidate() }}/>}
    <DataTableToolbar><DataTableSearch value={search.q} onChange={(q) => changeSearch({ q, halaman: 1 })}/><label className="form-control w-full max-w-xs"><span className="label-text mb-1">Status barang</span><select className="select select-bordered min-h-12" value={search.status} onChange={(event) => changeSearch({ status: event.target.value as typeof search.status, halaman: 1 })}><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option><option value="semua">Semua</option></select></label></DataTableToolbar>
    {!empty && <DataTable columns={columns} data={data} caption="Daftar barang untuk admin" rowKey={(row) => String(row.id)}/>}
    {empty && searching && <DataTableStates isEmpty isSearchEmpty query={search.q} onClearSearch={() => changeSearch({ q: '', halaman: 1 })}/>}
    {empty && !searching && (
      <EmptyState title="Belum ada barang. Tambahkan barang pertama." action={<button className="btn btn-primary min-h-11" onClick={() => setShowAdd(true)}>Tambah barang</button>} />
    )}
    {!empty && <DataTablePagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={(halaman) => changeSearch({ halaman })}/>}
    {editing && <EditBarangDialog key={editing.id} row={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await router.invalidate() }}/>}
  </section>
}

type EditFormStore = ReturnType<typeof useForm<typeof BarangSchema>>

function EditBarangDialog({ row, onClose, onSaved }: { row: BarangRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const form = useForm({ schema: BarangSchema, initialInput: { nama: row.nama, satuan: row.satuan, hargaJual: row.hargaJual } })
  const confirm = useConfirm()
  const [message, setMessage] = useState('')

  async function closeGuard() {
    if (!isDirty(form)) return true
    return confirm({ title: 'Buang perubahan?', message: 'Isian yang belum disimpan akan hilang', cancelText: 'Tetap mengedit', confirmText: 'Buang perubahan', danger: true })
  }

  async function submit(input: BarangInput) {
    setMessage('')
    const changes: Record<string, unknown> = {}
    const nameChanged = input.nama !== row.nama || input.satuan !== row.satuan
    const priceChanged = input.hargaJual !== row.hargaJual
    if (!nameChanged && !priceChanged) { onClose(); return }
    if (nameChanged && !await confirm({ title: 'Yakin?', message: `Ubah data “${row.nama}”?${input.satuan !== row.satuan ? ` Mengubah satuan dari ${row.satuan} menjadi ${input.satuan} mengubah arti angka stok yang sudah tercatat.` : ''}`, confirmText: 'Ubah data' })) return
    if (priceChanged) {
      const warning = row.hargaBeliTerakhir !== null && row.hargaBeliTerakhir !== undefined && input.hargaJual < row.hargaBeliTerakhir ? ` Peringatan: harga jual baru ${formatRupiah(input.hargaJual)} lebih rendah dari harga beli terakhir ${formatRupiah(row.hargaBeliTerakhir)}.` : ''
      if (!await confirm({ title: 'Yakin?', message: `Ubah harga jual dari ${formatRupiah(row.hargaJual)} menjadi ${formatRupiah(input.hargaJual)}?${warning}`, confirmText: 'Ubah harga' })) return
    }
    if (input.nama !== row.nama) changes.nama = input.nama
    if (input.satuan !== row.satuan) changes.satuan = input.satuan
    if (priceChanged) changes.hargaJual = input.hargaJual
    try {
      await ubahBarang(row.id, changes)
      reset(form)
      toast.success('Data barang diperbarui.')
      await onSaved()
    } catch (error) {
      setMessage(error instanceof ApiRequestError ? error.message : 'Data barang tidak dapat diperbarui.')
    }
  }

  return <Modal open onClose={onClose} title="Ubah barang" size="sedang" canClose={!form.isSubmitting} closeGuard={closeGuard}>
    <EditBarangFields form={form} message={message} loading={form.isSubmitting} onSubmit={submit}/>
  </Modal>
}

function EditBarangFields({ form, message, loading, onSubmit }: { form: EditFormStore; message: string; loading: boolean; onSubmit: (input: BarangInput) => Promise<void> }) {
  const close = useModalClose()
  const nama = useField(form, { path: ['nama'] })
  const satuan = useField(form, { path: ['satuan'] })
  const hargaJual = useField(form, { path: ['hargaJual'] })
  return <Form of={form} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
    <ModalBody className="grid content-start gap-4 sm:grid-cols-2">
      <TextField field={nama} label="Nama barang" required/>
      <SelectField field={satuan} label="Satuan" required options={satuanOptions}/>
      <RupiahField field={hargaJual} label="Harga jual" required/>
      <div className="sm:col-span-2"><FormAlert message={message}/></div>
    </ModalBody>
    <ModalFooter>
      <button type="button" className="btn btn-ghost min-h-11" disabled={loading} onClick={close}>Batal</button>
      <FormSubmitButton loading={loading}>Simpan perubahan</FormSubmitButton>
    </ModalFooter>
  </Form>
}
