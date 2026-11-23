import type { ReactNode } from 'react'
export { FormField, TextField, PasswordField, PasswordStrengthIndicator, NumberField, RupiahField, SelectField, DateField } from './fields'

export function FormSubmitButton({ children = 'Simpan', loading = false, disabled = false }: { children?: ReactNode; loading?: boolean; disabled?: boolean }) {
  return <button type="submit" className="btn btn-primary min-h-12 w-full sm:w-auto" disabled={disabled || loading} aria-busy={loading}>{loading && <span className="loading loading-spinner loading-sm" aria-hidden="true"/>}{loading ? 'Menyimpan...' : children}</button>
}

export function FormAlert({ message, children }: { message?: string; children?: ReactNode }) {
  if (!message && !children) return null
  return <div className="alert alert-error" role="alert">{message ?? children}</div>
}
