import { useRef, useState, type ReactNode } from 'react'
import type { FieldElementProps } from '@formisch/react'
import { Eye, EyeOff } from 'lucide-react'
import { formatRupiah } from '../../lib/format'
import { getPasswordAssessment, getPasswordSuggestion } from '../../lib/password-strength'
import { PasswordRequirementsPopover } from './password-requirements-popover'

type FormFieldStore = { path: readonly PropertyKey[]; input: unknown; errors: [string, ...string[]] | null; isTouched: boolean; onChange(value: unknown): void; props: FieldElementProps }
type FieldProps = { field: FormFieldStore; label: string; hint?: string; required?: boolean; type?: string; placeholder?: string; showStrength?: boolean; username?: string; inputMode?: 'text' | 'numeric' | 'decimal' | 'email'; autoComplete?: string }
export function FormField({ field, label, hint, required, children }: FieldProps & { children: ReactNode }) {
  const id = `field-${field.path.map(String).join('-')}`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const error = field.isTouched ? field.errors?.[0] : undefined
  return <div className="form-control w-full gap-1.5">
    <label className="label py-0" htmlFor={id}><span className="label-text font-medium">{label}{required && <span aria-hidden="true"> *</span>}</span></label>
    {children}
    {hint && <span id={hintId} className="label-text-alt text-base-content/70">{hint}</span>}
    {error && <span id={errorId} className="label-text-alt text-error" role="alert">{error}</span>}
  </div>
}
function ids(field: FormFieldStore) { const id = `field-${field.path.map(String).join('-')}`; return { id, describedBy: field.isTouched && field.errors?.[0] ? `${id}-error` : undefined } }

export function TextField(props: FieldProps) {
  const { field, required, placeholder, type = 'text', inputMode, autoComplete } = props
  const attr = ids(field)
  return <FormField {...props}><input {...field.props} id={attr.id} className={`input input-bordered min-h-12 w-full ${field.isTouched && field.errors?.length ? 'input-error' : ''}`} type={type} value={String(field.input ?? '')} placeholder={placeholder} inputMode={inputMode} autoComplete={autoComplete} required={required} aria-invalid={Boolean(field.isTouched && field.errors?.length)} aria-describedby={attr.describedBy ?? (props.hint ? `${attr.id}-hint` : undefined)} /></FormField>
}

export function PasswordStrengthIndicator({ password, username }: { password: string; username?: string }) {
  const strength = getPasswordAssessment(password, username).strength
  const active = strength === 'Lemah' ? 1 : strength === 'Sedang' ? 2 : 3
  return <div className="space-y-1">
    <div className="flex gap-1" aria-hidden="true">{[1, 2, 3].map((segment) => <span key={segment} className={`h-2 flex-1 rounded-full ${segment <= active ? (strength === 'Lemah' ? 'bg-error' : strength === 'Sedang' ? 'bg-warning' : 'bg-success') : 'bg-base-300'}`} />)}</div>
    <p className="text-sm" aria-live="polite">Kekuatan password: <strong>{strength}</strong>. {getPasswordSuggestion(strength)}</p>
  </div>
}

export function PasswordField(props: FieldProps) {
  const { field, required, showStrength, username } = props
  const [visible, setVisible] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const attr = ids(field)
  const password = typeof field.input === 'string' ? field.input : ''
  const requirementsId = `${attr.id}-requirements`
  const describedBy = [attr.describedBy, props.hint ? `${attr.id}-hint` : undefined, showStrength ? requirementsId : undefined].filter(Boolean).join(' ') || undefined
  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
    setPopoverOpen(false)
  }
  return <div ref={containerRef} className="relative w-full" onFocusCapture={() => { if (showStrength) setPopoverOpen(true) }} onBlurCapture={handleBlur}>
    <FormField {...props}><div className="join w-full">
      <input {...field.props} id={attr.id} className={`input input-bordered join-item min-h-12 w-full ${field.isTouched && field.errors?.length ? 'input-error' : ''}`} value={password} type={visible ? 'text' : 'password'} autoComplete="new-password" required={required} aria-invalid={Boolean(field.isTouched && field.errors?.length)} aria-describedby={describedBy} />
      <button type="button" className="btn btn-outline join-item min-h-12" aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setVisible((value) => !value)}>{visible ? <EyeOff /> : <Eye />}</button>
    </div>{showStrength && <PasswordStrengthIndicator password={password} username={username} />}</FormField>
    {showStrength && <PasswordRequirementsPopover password={password} username={username} open={popoverOpen} containerRef={containerRef} id={requirementsId}/>}
  </div>
}

export function NumberField({ field, label, decimals = 0, hint, required }: FieldProps & { decimals?: 0 | 1 }) {
  const attr = ids(field)
  return <FormField field={field} label={label} hint={hint} required={required}><input {...field.props} id={attr.id} value={typeof field.input === 'number' ? field.input : ''} onChange={(event) => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} type="number" step={decimals === 1 ? '0.1' : '1'} inputMode={decimals === 1 ? 'decimal' : 'numeric'} className={`input input-bordered min-h-12 w-full ${field.isTouched && field.errors?.length ? 'input-error' : ''}`} required={required} aria-invalid={Boolean(field.isTouched && field.errors?.length)} aria-describedby={[attr.describedBy, hint ? `${attr.id}-hint` : undefined].filter(Boolean).join(' ') || undefined}/></FormField>
}

export function RupiahField({ field, label, hint, required }: FieldProps) {
  const attr = ids(field)
  const raw = typeof field.input === 'number' ? field.input : typeof field.input === 'string' ? Number(field.input) : 0
  const display = Number.isFinite(raw) && raw > 0 ? formatRupiah(raw).replace(/^Rp\s?/, '') : ''
  return <FormField field={field} label={label} hint={hint} required={required}><div className="join w-full"><span className="join-item btn btn-disabled min-h-12" aria-hidden="true">Rp</span><input {...field.props} id={attr.id} className={`input input-bordered join-item min-h-12 w-full ${field.isTouched && field.errors?.length ? 'input-error' : ''}`} type="text" inputMode="numeric" value={display} onChange={(event) => { const digits = event.target.value.replace(/\D/g, ''); field.onChange(digits === '' ? '' : Number(digits)) }} required={required} aria-label={`${label}, dalam rupiah`} aria-invalid={Boolean(field.isTouched && field.errors?.length)} aria-describedby={[attr.describedBy, hint ? `${attr.id}-hint` : undefined].filter(Boolean).join(' ') || undefined}/></div></FormField>
}

export function SelectField({ field, label, hint, required, options = [] }: FieldProps & { options: { label: string; value: string }[] }) {
  const attr = ids(field)
  return <FormField field={field} label={label} hint={hint} required={required}><select {...field.props} id={attr.id} value={String(field.input ?? '')} className={`select select-bordered min-h-12 w-full ${field.isTouched && field.errors?.length ? 'select-error' : ''}`} required={required} aria-invalid={Boolean(field.isTouched && field.errors?.length)} aria-describedby={[attr.describedBy, hint ? `${attr.id}-hint` : undefined].filter(Boolean).join(' ') || undefined}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FormField>
}

export function DateField({ field, label, hint, required }: FieldProps) {
  const attr = ids(field)
  return <FormField field={field} label={label} hint={hint} required={required}><input {...field.props} id={attr.id} value={String(field.input ?? '')} type="date" className={`input input-bordered min-h-12 w-full ${field.isTouched && field.errors?.length ? 'input-error' : ''}`} required={required} aria-invalid={Boolean(field.isTouched && field.errors?.length)} aria-describedby={[attr.describedBy, hint ? `${attr.id}-hint` : undefined].filter(Boolean).join(' ') || undefined}/></FormField>
}
