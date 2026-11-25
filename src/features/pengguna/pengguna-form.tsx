import { Form, isDirty, reset, useField, useForm } from '@formisch/react'
import { useState } from 'react'
import { useConfirm } from '../../components/confirm/use-confirm'
import { FormAlert, FormSubmitButton, PasswordField, TextField } from '../../components/form'
import { Modal, ModalBody, ModalFooter, useModalClose } from '../../components/modal'
import { useToast } from '../../components/toast/use-toast'
import { ApiRequestError } from '../../lib/api'
import { PenggunaSchema, type PenggunaInput } from '../../validation/pengguna'
import { buatKasir } from './queries'

export function PenggunaForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const form = useForm({ schema: PenggunaSchema, initialInput: { username: '', password: '' } })
  const confirm = useConfirm()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  async function closeGuard() {
    if (!isDirty(form)) return true
    return confirm({ title: 'Buang perubahan?', message: 'Isian yang belum disimpan akan hilang', cancelText: 'Tetap mengisi', confirmText: 'Buang isian', danger: true })
  }

  async function submit(input: PenggunaInput) {
    setMessage('')
    setLoading(true)
    try {
      await buatKasir(input)
      reset(form)
      showToast('sukses', 'Akun kasir dibuat.')
      onSaved()
    } catch (error) {
      setMessage(error instanceof ApiRequestError ? error.message : 'Akun kasir tidak dapat dibuat. Periksa koneksi lalu coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return <Modal open onClose={onClose} title="Buat akun kasir" size="sedang" canClose={!loading} closeGuard={closeGuard}>
    <PenggunaFormFields form={form} message={message} loading={loading} onSubmit={submit}/>
  </Modal>
}

function PenggunaFormFields({ form, message, loading, onSubmit }: { form: ReturnType<typeof useForm<typeof PenggunaSchema>>; message: string; loading: boolean; onSubmit: (input: PenggunaInput) => Promise<void> }) {
  const close = useModalClose()
  const username = useField(form, { path: ['username'] })
  const password = useField(form, { path: ['password'] })
  return <Form of={form} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
    <ModalBody className="space-y-4">
      <TextField field={username} label="Username kasir" required autoComplete="username" />
      <PasswordField field={password} label="Password" required showStrength username={typeof username.input === 'string' ? username.input : ''} />
      <FormAlert message={message}/>
    </ModalBody>
    <ModalFooter>
      <button type="button" className="btn btn-ghost min-h-11" disabled={loading} onClick={close}>Batal</button>
      <FormSubmitButton loading={loading}>Buat akun kasir</FormSubmitButton>
    </ModalFooter>
  </Form>
}
