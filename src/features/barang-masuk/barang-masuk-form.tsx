import { Form, reset, useField, useForm } from '@formisch/react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { FormAlert, FormSubmitButton, DateField, NumberField, RupiahField, TextField } from '../../components/form'
import { useConfirm } from '../../components/confirm/use-confirm'
import { useToast } from '../../components/toast/use-toast'
import { ApiRequestError } from '../../lib/api'
import { formatRupiah } from '../../lib/format'
import { BarangMasukSchema, isJumlahValidUntukSatuan, type BarangMasukInput } from '../../validation/barang-masuk'
import { simpanBarangMasuk, type PilihanBarang } from './queries'
import { BarangSelectField } from '../barang/barang-select-field'

function tanggalHariIniLokal() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function isPriceWarning(value: unknown): value is { type: 'harga-beli-di-atas-jual'; hargaBeli: number; hargaJual: number } {
  if (typeof value !== 'object' || value === null) return false
  const warning = value as Record<string, unknown>
  return warning.type === 'harga-beli-di-atas-jual' && typeof warning.hargaBeli === 'number' && typeof warning.hargaJual === 'number'
}

export function BarangMasukForm() {
  const router = useRouter()
  const confirm = useConfirm()
  const { showToast } = useToast()
  const form = useForm({ schema: BarangMasukSchema, initialInput: { tanggal: '', barangId: 0, jumlah: 0, hargaBeli: 0, pemasok: '' } })
  const tanggal = useField(form, { path: ['tanggal'] })
  const barangField = useField(form, { path: ['barangId'] })
  const jumlah = useField(form, { path: ['jumlah'] })
  const hargaBeli = useField(form, { path: ['hargaBeli'] })
  const pemasok = useField(form, { path: ['pemasok'] })
  const selectRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<PilihanBarang | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Tanggal bawaan dihitung di browser agar zona waktu tidak menimbulkan perbedaan SSR.
  useEffect(() => { if (!tanggal.input) tanggal.onChange(tanggalHariIniLokal()) }, [tanggal])

  async function submit(input: BarangMasukInput) {
    setMessage('')
    if (!selected || selected.id !== input.barangId) { setMessage('Pilih barang yang tersedia.'); selectRef.current?.focus(); return }
    if (!isJumlahValidUntukSatuan(input.jumlah, selected.satuan)) { setMessage('Jumlah untuk satuan ini harus bilangan bulat.'); return }
    setLoading(true)
    try {
      let hargaJualDikonfirmasi: number | undefined
      while (true) {
        try {
          await simpanBarangMasuk(input, hargaJualDikonfirmasi)
          break
        } catch (error) {
          if (!(error instanceof ApiRequestError) || !isPriceWarning(error.details)) throw error
          const warning = error.details
          const proceed = await confirm({
            title: 'Periksa harga beli',
            message: `Harga beli ${formatRupiah(warning.hargaBeli)} lebih tinggi dari harga jual ${formatRupiah(warning.hargaJual)}. Periksa kembali sebelum menyimpan.`,
            confirmText: 'Tetap simpan',
            cancelText: 'Periksa lagi',
          })
          if (!proceed) return
          hargaJualDikonfirmasi = warning.hargaJual
        }
      }
      await router.invalidate()
      showToast('sukses', 'Barang masuk tersimpan.')
      reset(form)
      tanggal.onChange(tanggalHariIniLokal())
      setSelected(null)
      setMessage('')
      window.setTimeout(() => selectRef.current?.focus(), 0)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const fields = Object.entries(error.fields).map(([name, text]) => `${name}: ${text}`).join(' ')
        setMessage(fields ? `${error.message} ${fields}` : error.message)
      }
      else setMessage('Barang masuk tidak dapat disimpan. Periksa koneksi lalu coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return <Form of={form} onSubmit={submit} className="card border border-base-300 bg-base-100">
    <div className="card-body gap-4">
      <h2 className="card-title">Catat barang masuk</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField field={tanggal} label="Tanggal" required/>
        <BarangSelectField field={barangField} selected={selected} inputRef={selectRef} onSelected={(item) => setSelected(item)}/>
        <NumberField field={jumlah} label="Jumlah" decimals={selected?.satuan === 'kg' ? 1 : 0} required hint={selected ? `Satuan: ${selected.satuan}${selected.satuan === 'kg' ? ' — boleh satu angka di belakang koma.' : ' — harus bilangan bulat.'}` : 'Pilih barang untuk melihat satuannya.'}/>
        <RupiahField field={hargaBeli} label="Harga beli" required hint="Masukkan harga beli per satuan dalam rupiah bulat."/>
        <TextField field={pemasok} label="Pemasok" placeholder="Nama pemasok (opsional)"/>
      </div>
      <FormAlert message={message}/>
      <div className="flex justify-end"><FormSubmitButton loading={loading}>Simpan barang masuk</FormSubmitButton></div>
    </div>
  </Form>
}
