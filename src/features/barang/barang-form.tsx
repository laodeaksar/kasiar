import { Form, isDirty, reset, useField, useForm } from '@formisch/react'
import { useState } from 'react'
import { useConfirm } from '../../components/confirm/use-confirm'
import { FormAlert, FormSubmitButton, RupiahField, SelectField, TextField } from '../../components/form'
import { Modal, ModalBody, ModalFooter, useModalClose } from '../../components/modal'
import { useToast } from '../../components/toast/use-toast'
import { ApiRequestError } from '../../lib/api'
import { SATUAN_BARANG } from '../../lib/konstanta'
import { BarangSchema, type BarangInput } from '../../validation/barang'
import { tambahBarang } from './queries'

const satuanOptions = SATUAN_BARANG.map((value) => ({ value, label: value === 'kg' ? 'Kilogram (kg)' : value }))

export function BarangForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const initialInput = { nama: '', satuan: 'pcs', hargaJual: 0 }
  const form = useForm({ schema: BarangSchema, initialInput })
  const confirm = useConfirm()
  const [message, setMessage] = useState('')
  const { showToast } = useToast()

  async function closeGuard() {
    if (!isDirty(form)) return true
    return confirm({ title: 'Buang perubahan?', message: 'Isian yang belum disimpan akan hilang', cancelText: 'Tetap mengisi', confirmText: 'Buang isian', danger: true })
  }

  async function submit(input: BarangInput) {
    setMessage('')
    try {
      await tambahBarang(input)
      reset(form)
      showToast('sukses', 'Barang ditambahkan.')
      onSaved()
    } catch (error) {
      setMessage(error instanceof ApiRequestError ? error.message : 'Barang tidak dapat ditambahkan. Periksa koneksi lalu coba lagi.')
    }
  }

  return <Modal open onClose={onClose} title="Barang baru" size="sedang" canClose={!form.isSubmitting} closeGuard={closeGuard}>
    <BarangFormFields form={form} message={message} loading={form.isSubmitting} onSubmit={submit}/>
  </Modal>
}

function BarangFormFields({ form, message, loading, onSubmit }: { form: ReturnType<typeof useForm<typeof BarangSchema>>; message: string; loading: boolean; onSubmit: (input: BarangInput) => Promise<void> }) {
  const close = useModalClose()
  const nama = useField(form, { path: ['nama'] })
  const satuan = useField(form, { path: ['satuan'] })
  const hargaJual = useField(form, { path: ['hargaJual'] })
  return <Form of={form} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
    <ModalBody className="grid content-start gap-4 sm:grid-cols-2">
      <TextField field={nama} label="Nama barang" required placeholder="Contoh: Beras eceran" />
      <SelectField field={satuan} label="Satuan" required options={satuanOptions} />
      <RupiahField field={hargaJual} label="Harga jual" required hint="Masukkan angka rupiah bulat." />
      <div className="sm:col-span-2"><FormAlert message={message}/></div>
    </ModalBody>
    <ModalFooter>
      <button type="button" className="btn btn-ghost min-h-11" disabled={loading} onClick={close}>Batal</button>
      <FormSubmitButton loading={loading}>Tambah barang</FormSubmitButton>
    </ModalFooter>
  </Form>
}
