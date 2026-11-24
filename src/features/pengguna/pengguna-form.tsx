import { Form, reset, useField, useForm } from '@formisch/react'
import { useState } from 'react'
import { FormAlert, FormSubmitButton, PasswordField, TextField } from '../../components/form'
import { useToast } from '../../components/toast/use-toast'
import { ApiRequestError } from '../../lib/api'
import { PenggunaSchema, type PenggunaInput } from '../../validation/pengguna'
import { buatKasir } from './queries'
export function PenggunaForm({ onSaved }: { onSaved: () => void }) {
  const form = useForm({ schema: PenggunaSchema, initialInput: { username: '', password: '' } })
  const username = useField(form, { path: ['username'] }); const password = useField(form, { path: ['password'] })
  const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const { showToast } = useToast()
  async function submit(input: PenggunaInput) {
    setMessage(''); setLoading(true)
    try { await buatKasir(input); reset(form); showToast('sukses', 'Akun kasir dibuat.'); onSaved() }
    catch (error) { setMessage(error instanceof ApiRequestError ? error.message : 'Akun kasir tidak dapat dibuat. Periksa koneksi lalu coba lagi.') }
    finally { setLoading(false) }
  }
  return <Form of={form} onSubmit={submit} className="space-y-4">
    <TextField field={username} label="Username kasir" required autoComplete="username" />
    <PasswordField field={password} label="Password" required showStrength username={typeof username.input === 'string' ? username.input : ''} />
    <FormAlert message={message}/><FormSubmitButton loading={loading}>Buat akun kasir</FormSubmitButton>
  </Form>
}
