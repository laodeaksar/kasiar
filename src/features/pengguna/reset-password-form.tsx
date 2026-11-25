import { Form, isDirty, reset, useField, useForm } from '@formisch/react'
import { useState } from 'react'
import { useConfirm } from '../../components/confirm/use-confirm'
import { FormAlert, FormSubmitButton, PasswordField } from '../../components/form'
import { Modal, ModalBody, ModalFooter, useModalClose } from '../../components/modal'
import { useToast } from '../../components/toast/use-toast'
import { ApiRequestError } from '../../lib/api'
import { ResetPasswordSchema, type ResetPasswordInput } from '../../validation/reset-password'
import type { KasirRow } from './queries'
import { resetPasswordKasir } from './queries'

export function ResetPasswordForm({ kasir, onDone }: { kasir: KasirRow; onDone: () => void }) {
  const form = useForm({ schema: ResetPasswordSchema, initialInput: { userId: kasir.id, username: kasir.username, password: '' } })
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function closeGuard() {
    if (!isDirty(form)) return true
    return confirm({ title: 'Buang perubahan?', message: 'Isian yang belum disimpan akan hilang', cancelText: 'Tetap mengisi', confirmText: 'Buang password', danger: true })
  }

  async function submit(input: ResetPasswordInput) {
    setMessage('')
    if (!await confirm({ title: 'Yakin?', message: `Reset password untuk akun kasir “${kasir.username}”?`, confirmText: 'Reset password', danger: true })) return
    setLoading(true)
    try {
      await resetPasswordKasir(kasir.id, input)
      reset(form)
      showToast('sukses', 'Password kasir direset.')
      onDone()
    } catch (error) {
      setMessage(error instanceof ApiRequestError ? error.message : 'Password tidak dapat direset. Periksa koneksi lalu coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return <Modal open onClose={onDone} title={`Reset password: ${kasir.username}`} size="sedang" canClose={!loading} closeGuard={closeGuard}>
    <ResetPasswordFields form={form} message={message} loading={loading} username={kasir.username} onSubmit={submit}/>
  </Modal>
}

function ResetPasswordFields({ form, message, loading, username, onSubmit }: { form: ReturnType<typeof useForm<typeof ResetPasswordSchema>>; message: string; loading: boolean; username: string; onSubmit: (input: ResetPasswordInput) => Promise<void> }) {
  const close = useModalClose()
  const password = useField(form, { path: ['password'] })
  return <Form of={form} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
    <ModalBody className="space-y-3">
      <p className="font-medium">Password baru untuk {username}</p>
      <PasswordField field={password} label="Password baru" required showStrength username={username}/>
      <FormAlert message={message}/>
    </ModalBody>
    <ModalFooter>
      <button type="button" className="btn btn-ghost min-h-11" disabled={loading} onClick={close}>Batal</button>
      <FormSubmitButton loading={loading}>Reset password</FormSubmitButton>
    </ModalFooter>
  </Form>
}
