import { Form, reset, setErrors, useField, useForm } from '@formisch/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FormAlert, FormSubmitButton, RupiahField } from '../../components/form'
import { useConfirm } from '../../components/confirm/use-confirm'
import { toast } from '../../components/toast/toast-store'
import { ApiRequestError } from '../../lib/api'
import { formatRupiah } from '../../lib/format'
import { PelunasanSchema, type PelunasanInput } from '../../validation/pelunasan'
import { PembeliField } from './pembeli-field'
import { simpanPelunasanMutationOptions, utangDetailOptions } from './queries'

export function PelunasanForm({ onSaved }: { onSaved?: (buyerId: number) => void }) {
  const confirm = useConfirm()
  const mutation = useMutation(simpanPelunasanMutationOptions())
  const [selected, setSelected] = useState<{ id: number; nama: string } | null>(null)
  const [message, setMessage] = useState('')
  const form = useForm({
    schema: PelunasanSchema,
    initialInput: { pembeliNama: '', pembeliId: 0, nominal: 0 },
  })
  const nama = useField(form, { path: ['pembeliNama'] })
  const pembeliId = useField(form, { path: ['pembeliId'] })
  const nominal = useField(form, { path: ['nominal'] })
  const { data: detail } = useQuery(utangDetailOptions(selected?.id))

  async function submit(input: PelunasanInput) {
    setMessage('')
    if (!selected || selected.id !== input.pembeliId) {
      setMessage('Pilih pembeli dari daftar yang memiliki utang.')
      return
    }
    if (!detail || detail.sisaUtang <= 0) {
      setMessage('Pembeli ini tidak memiliki sisa utang.')
      return
    }
    if (input.nominal > detail.sisaUtang) {
      setErrors(form, { path: ['nominal'], errors: ['Nominal tidak boleh melebihi sisa utang.'] })
      return
    }
    const after = detail.sisaUtang - input.nominal
    const accepted = await confirm({
      title: 'Yakin mencatat pembayaran?',
      message: `${selected.nama} membayar ${formatRupiah(input.nominal)}. Sisa utang setelah bayar: ${formatRupiah(after)}.`,
      confirmText: 'Catat pembayaran',
    })
    if (!accepted) return
    try {
      await mutation.mutateAsync(input)
      toast.success('Pembayaran tercatat.')
      setSelected(null)
      reset(form)
      onSaved?.(input.pembeliId)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.fields.pembeliId || error.fields.pembeliNama)
          setErrors(form, {
            path: ['pembeliNama'],
            errors: [error.fields.pembeliId ?? error.fields.pembeliNama],
          })
        if (error.fields.nominal)
          setErrors(form, { path: ['nominal'], errors: [error.fields.nominal] })
        setMessage(error.message)
      } else setMessage('Pembayaran tidak dapat disimpan. Periksa koneksi lalu coba lagi.')
    }
  }

  return (
    <Form of={form} onSubmit={submit} className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <h2 className="card-title">Catat pelunasan</h2>
        <PembeliField
          field={nama}
          onSelected={(buyer) => {
            setSelected(buyer)
            pembeliId.onChange(buyer?.id ?? 0)
          }}
        />
        {selected && (
          <p className="text-sm">
            Sisa utang saat ini: {detail ? formatRupiah(detail.sisaUtang) : 'Memuat saldo...'}
          </p>
        )}
        <RupiahField field={nominal} label="Nominal pembayaran" required />
        <FormAlert message={message} />
        <div className="flex justify-end">
          <FormSubmitButton loading={mutation.isPending}>Catat pembayaran</FormSubmitButton>
        </div>
      </div>
    </Form>
  )
}
