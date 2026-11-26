import { Form, isDirty, reset, setErrors, useField, useForm } from '@formisch/react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useConfirm } from '../../components/confirm/use-confirm'
import { FormAlert, FormSubmitButton, PasswordField } from '../../components/form'
import { Modal, ModalBody, ModalFooter, useModalClose } from '../../components/modal'
import { toast } from '../../components/toast/toast-store'
import { ApiRequestError } from '../../lib/api'
import { ResetPasswordSchema, type ResetPasswordInput } from '../../validation/reset-password'
import type { KasirRow } from './queries'
import { resetPasswordMutationOptions } from './queries'

export function ResetPasswordForm({ kasir, onDone }: { kasir: KasirRow; onDone: () => void }) {
  const form = useForm({ schema: ResetPasswordSchema, initialInput: { userId: kasir.id, username: kasir.username, password: '' } })
  const confirm = useConfirm()
  const mutation = useMutation(resetPasswordMutationOptions())
  const [message, setMessage] = useState('')

  async function closeGuard() {
    if (!isDirty(form)) return true
    return confirm({ title: 'Buang perubahan?', message: 'Isian yang belum disimpan akan hilang', cancelText: 'Tetap mengisi', confirmText: 'Buang password', danger: true })
  }

  async function submit(input: ResetPasswordInput) {
    setMessage('')
    setErrors(form, { path: ['password'], errors: null })
    if (!await confirm({ title: 'Yakin?', message: `Reset password untuk akun kasir “${kasir.username}”?`, confirmText: 'Reset password', danger: true })) return
    try {
      await mutation.mutateAsync(input)
      reset(form)
      toast.success('Password kasir direset.')
      onDone()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.fields.password) setErrors(form, { path: ['password'], errors: [error.fields.password] })
        setMessage(error.message)
      } else setMessage('Password tidak dapat direset. Periksa koneksi lalu coba lagi.')
    }
  }

  return <Modal open onClose={onDone} title={`Reset password: ${kasir.username}`} size="sedang" canClose={!mutation.isPending} closeGuard={closeGuard}>
    <ResetPasswordFields form={form} message={message} loading={mutation.isPending} username={kasir.username} onSubmit={submit}/>
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
