import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import type { FieldElementProps } from '@formisch/react'
import { Eye, EyeOff } from 'lucide-react'
import { formatRupiah } from '../../lib/format'
import { getPasswordAssessment, getPasswordSuggestion } from '../../lib/password-strength'
import { PasswordRequirementsPopover } from './password-requirements-popover'

type FormFieldStore = {
  path: readonly PropertyKey[]
  input: unknown
  errors: [string, ...string[]] | null
  isTouched: boolean
  onChange(value: unknown): void
  props: FieldElementProps
}
type FieldProps = {
  field: FormFieldStore
  label: string
  hint?: string
  required?: boolean
  type?: string
  placeholder?: string
  showStrength?: boolean
  username?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email'
  autoComplete?: string
}
function errorText(field: FormFieldStore) {
  return field.isTouched ? (field.errors?.[0] ?? '') : ''
}

function useValidity<T extends HTMLInputElement>(message: string) {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.setCustomValidity(message)
  }, [message])
  return ref
}

export function FieldShell({
  label,
  hint,
  message,
  children,
}: {
  label?: string
  hint?: string
  message: string
  children: ReactNode
}) {
  return (
    <fieldset className="fieldset min-w-0">
      {label ? <legend className="fieldset-legend">{label}</legend> : null}
      {children}
      <p
        role={message ? 'alert' : undefined}
        className={`validator-hint ${message ? 'mt-0! block! visible! text-error wrap-anywhere' : 'hidden'}`}
      >
        {message}
      </p>
      {hint && !message ? (
        <p className="label h-auto max-w-full whitespace-normal wrap-anywhere">{hint}</p>
      ) : null}
    </fieldset>
  )
}

export function FormField({
  field,
  label,
  hint,
  required,
  children,
}: FieldProps & { children: ReactNode }) {
  return (
    <FieldShell label={`${label}${required ? ' *' : ''}`} hint={hint} message={errorText(field)}>
      {children}
    </FieldShell>
  )
}
function ids(field: FormFieldStore, hint?: string) {
  const id = `field-${field.path.map(String).join('-')}`
  const message = errorText(field)
  return {
    id,
    describedBy:
      [message ? `${id}-error` : undefined, hint ? `${id}-hint` : undefined]
        .filter(Boolean)
        .join(' ') || undefined,
  }
}

type InputExtra = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'onBlur' | 'name' | 'id'
>

export function TextField({
  label,
  field,
  hint,
  icon,
  trailing,
  ...rest
}: {
  label: string
  field: FormFieldStore
  hint?: string
  icon?: ReactNode
  trailing?: ReactNode
} & InputExtra) {
  const message = errorText(field)
  const ref = useValidity<HTMLInputElement>(message)
  const attr = ids(field, hint)
  const wrapped = !!(icon || trailing)
  const describedBy =
    [attr.describedBy, rest['aria-describedby']].filter(Boolean).join(' ') || undefined
  const input = (
    <input
      {...rest}
      {...field.props}
      ref={ref}
      id={attr.id}
      value={String(field.input ?? '')}
      onBlur={field.props.onBlur}
      onChange={(event) => field.onChange(event.target.value)}
      aria-invalid={!!message}
      aria-describedby={describedBy}
      className={wrapped ? 'grow' : `input validator w-full ${message ? 'input-error' : ''}`}
    />
  )
  return (
    <FieldShell label={`${label}${rest.required ? ' *' : ''}`} hint={hint} message={message}>
      {wrapped ? (
        <label className={`input validator w-full ${message ? 'input-error' : ''}`}>
          {icon}
          {input}
          {trailing}
        </label>
      ) : (
        input
      )}
    </FieldShell>
  )
}

export function PasswordStrengthIndicator({
  password,
  username,
}: {
  password: string
  username?: string
}) {
  const strength = getPasswordAssessment(password, username).strength
  const active = strength === 'Lemah' ? 1 : strength === 'Sedang' ? 2 : 3
  return (
    <div className="space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={`h-2 flex-1 rounded-full ${segment <= active ? (strength === 'Lemah' ? 'bg-error' : strength === 'Sedang' ? 'bg-warning' : 'bg-success') : 'bg-base-300'}`}
          />
        ))}
      </div>
      <p className="text-sm" aria-live="polite">
        Kekuatan password: <strong>{strength}</strong>. {getPasswordSuggestion(strength)}
      </p>
    </div>
  )
}

export function PasswordField(props: FieldProps & InputExtra) {
  const { field, showStrength, username, ...textProps } = props
  const [visible, setVisible] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const attr = ids(field, props.hint)
  const password = typeof field.input === 'string' ? field.input : ''
  const requirementsId = `${attr.id}-requirements`
  const describedBy =
    [
      attr.describedBy,
      props.hint ? `${attr.id}-hint` : undefined,
      showStrength ? requirementsId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
      return
    setPopoverOpen(false)
  }
  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onFocusCapture={() => {
        if (showStrength) setPopoverOpen(true)
      }}
      onBlurCapture={handleBlur}
    >
      <TextField
        {...textProps}
        field={field}
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        aria-describedby={describedBy}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
            className="btn btn-circle btn-ghost btn-xs"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
      {showStrength && <PasswordStrengthIndicator password={password} username={username} />}
      {showStrength && (
        <PasswordRequirementsPopover
          password={password}
          username={username}
          open={popoverOpen}
          containerRef={containerRef}
          id={requirementsId}
        />
      )}
    </div>
  )
}

export function NumberField({
  field,
  label,
  decimals = 0,
  hint,
  required,
}: FieldProps & { decimals?: 0 | 1 }) {
  const attr = ids(field)
  return (
    <FormField field={field} label={label} hint={hint} required={required}>
      <input
        {...field.props}
        id={attr.id}
        value={typeof field.input === 'number' ? field.input : ''}
        onChange={(event) =>
          field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
        }
        type="number"
        step={decimals === 1 ? '0.1' : '1'}
        inputMode={decimals === 1 ? 'decimal' : 'numeric'}
        className={`input input-bordered min-h-12 w-full ${field.isTouched && field.errors?.length ? 'input-error' : ''}`}
        required={required}
        aria-invalid={Boolean(field.isTouched && field.errors?.length)}
        aria-describedby={
          [attr.describedBy, hint ? `${attr.id}-hint` : undefined].filter(Boolean).join(' ') ||
          undefined
        }
      />
    </FormField>
  )
}

export function RupiahField({ field, label, hint, required }: FieldProps) {
  const attr = ids(field)
  const raw =
    typeof field.input === 'number'
      ? field.input
      : typeof field.input === 'string'
        ? Number(field.input)
        : 0
  const display = Number.isFinite(raw) && raw > 0 ? formatRupiah(raw).replace(/^Rp\s?/, '') : ''
  return (
    <FormField field={field} label={label} hint={hint} required={required}>
      <div className="join w-full">
        <span className="join-item btn btn-disabled min-h-12" aria-hidden="true">
          Rp
        </span>
        <input
          {...field.props}
          id={attr.id}
          className={`input input-bordered join-item min-h-12 w-full ${field.isTouched && field.errors?.length ? 'input-error' : ''}`}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '')
            field.onChange(digits === '' ? '' : Number(digits))
          }}
          required={required}
          aria-label={`${label}, dalam rupiah`}
          aria-invalid={Boolean(field.isTouched && field.errors?.length)}
          aria-describedby={
            [attr.describedBy, hint ? `${attr.id}-hint` : undefined].filter(Boolean).join(' ') ||
            undefined
          }
        />
      </div>
    </FormField>
  )
}

export function SelectField({
  field,
  label,
  hint,
  required,
  options = [],
}: FieldProps & { options: { label: string; value: string }[] }) {
  const attr = ids(field)
  return (
    <FormField field={field} label={label} hint={hint} required={required}>
      <select
        {...field.props}
        id={attr.id}
        value={String(field.input ?? '')}
        className={`select select-bordered min-h-12 w-full ${field.isTouched && field.errors?.length ? 'select-error' : ''}`}
        required={required}
        aria-invalid={Boolean(field.isTouched && field.errors?.length)}
        aria-describedby={
          [attr.describedBy, hint ? `${attr.id}-hint` : undefined].filter(Boolean).join(' ') ||
          undefined
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

export function DateField({ field, label, hint, required }: FieldProps) {
  const attr = ids(field)
  return (
    <FormField field={field} label={label} hint={hint} required={required}>
      <input
        {...field.props}
        id={attr.id}
        value={String(field.input ?? '')}
        type="date"
        className={`input input-bordered min-h-12 w-full ${field.isTouched && field.errors?.length ? 'input-error' : ''}`}
        required={required}
        aria-invalid={Boolean(field.isTouched && field.errors?.length)}
        aria-describedby={
          [attr.describedBy, hint ? `${attr.id}-hint` : undefined].filter(Boolean).join(' ') ||
          undefined
        }
      />
    </FormField>
  )
}
