import { Form, reset, useField, useForm } from '@formisch/react'
import { useState } from 'react'
import { FormAlert, FormSubmitButton, PasswordField } from '../../components/form'
import { useConfirm } from '../../components/confirm/use-confirm'
import { useToast } from '../../components/toast/use-toast'
import { ApiRequestError } from '../../lib/api'
import { ResetPasswordSchema, type ResetPasswordInput } from '../../validation/reset-password'
import type { KasirRow } from './queries'
import { resetPasswordKasir } from './queries'
export function ResetPasswordForm({ kasir, onDone }: { kasir: KasirRow; onDone: () => void }) {
  const form = useForm({ schema: ResetPasswordSchema, initialInput: { userId: kasir.id, username: kasir.username, password: '' } })
  const password = useField(form, { path: ['password'] }); const confirm = useConfirm(); const { showToast } = useToast()
  const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(input: ResetPasswordInput) {
    setMessage('')
    if (!await confirm({ title: 'Yakin?', message: `Reset password untuk akun kasir “${kasir.username}”?`, confirmText: 'Reset password', danger: true })) return
    setLoading(true)
    try { await resetPasswordKasir(kasir.id, input); reset(form); showToast('sukses', 'Password kasir direset.'); onDone() }
    catch (error) { setMessage(error instanceof ApiRequestError ? error.message : 'Password tidak dapat direset. Periksa koneksi lalu coba lagi.') }
    finally { setLoading(false) }
  }
  return <Form of={form} onSubmit={submit} className="space-y-3 rounded-box border border-base-300 p-4">
    <h3 className="font-semibold">Password baru untuk {kasir.username}</h3>
    <PasswordField field={password} label="Password baru" required showStrength username={kasir.username}/>
    <FormAlert message={message}/><div className="flex flex-wrap gap-2"><FormSubmitButton loading={loading}>Reset password</FormSubmitButton><button type="button" className="btn btn-ghost min-h-12" onClick={onDone}>Batal</button></div>
  </Form>
}
