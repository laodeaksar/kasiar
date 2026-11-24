import { Form, reset, useField, useForm } from '@formisch/react'
import { useState } from 'react'
import { FormAlert, FormSubmitButton, RupiahField, SelectField, TextField } from '../../components/form'
import { useToast } from '../../components/toast/use-toast'
import { SATUAN_BARANG } from '../../lib/konstanta'
import { ApiRequestError } from '../../lib/api'
import { BarangSchema, type BarangInput } from '../../validation/barang'
import { tambahBarang } from './queries'
const satuanOptions = SATUAN_BARANG.map((value) => ({ value, label: value === 'kg' ? 'Kilogram (kg)' : value }))
export function BarangForm({ onSaved }: { onSaved: () => void }) {
  const form = useForm({ schema: BarangSchema, initialInput: { nama: '', satuan: 'pcs', hargaJual: 0 } })
  const nama = useField(form, { path: ['nama'] }); const satuan = useField(form, { path: ['satuan'] }); const hargaJual = useField(form, { path: ['hargaJual'] })
  const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const { showToast } = useToast()
  async function submit(input: BarangInput) {
    setMessage(''); setLoading(true)
    try { await tambahBarang(input); reset(form); showToast('sukses', 'Barang ditambahkan.'); onSaved() }
    catch (error) { setMessage(error instanceof ApiRequestError ? error.message : 'Barang tidak dapat ditambahkan. Periksa koneksi lalu coba lagi.') }
    finally { setLoading(false) }
  }
  return <Form of={form} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
    <TextField field={nama} label="Nama barang" required placeholder="Contoh: Beras eceran" />
    <SelectField field={satuan} label="Satuan" required options={satuanOptions} />
    <RupiahField field={hargaJual} label="Harga jual" required hint="Masukkan angka rupiah bulat." />
    <div className="sm:col-span-2"><FormAlert message={message}/><FormSubmitButton loading={loading}>Tambah barang</FormSubmitButton></div>
  </Form>
}
