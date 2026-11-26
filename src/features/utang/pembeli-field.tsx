import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { FieldElementProps } from '@formisch/react'
import { pembeliOptions } from '../kasir/queries'

type Field = {
  input: unknown
  errors: [string, ...string[]] | null
  isTouched: boolean
  onChange(value: unknown): void
  props: FieldElementProps
  path: readonly PropertyKey[]
}
export function PembeliField({
  field,
  onSelected,
}: {
  field: Field
  onSelected?: (buyer: { id: number; nama: string } | null) => void
}) {
  const [open, setOpen] = useState(false)
  const value = typeof field.input === 'string' ? field.input : ''
  const { data = [], isPending } = useQuery(pembeliOptions(value, open))
  const id = `field-${field.path.map(String).join('-')}`
  const error = field.isTouched ? field.errors?.[0] : undefined
  return (
    <div
      className="form-control relative w-full gap-1.5"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <label className="label py-0" htmlFor={id}>
        <span className="label-text font-medium">
          Nama pembeli <span aria-hidden="true">*</span>
        </span>
      </label>
      <input
        {...field.props}
        id={id}
        value={value}
        className={`input input-bordered min-h-12 w-full ${error ? 'input-error' : ''}`}
        placeholder="Pilih atau ketik nama pembeli"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          field.onChange(event.target.value)
          onSelected?.(null)
          setOpen(true)
        }}
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-box border border-base-300 bg-base-100 shadow-lg">
          {isPending && <p className="p-3 text-sm">Mencari pembeli...</p>}
          {data.map((item) => (
            <button
              type="button"
              key={item.id}
              className="block min-h-11 w-full px-3 text-left hover:bg-base-200"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                field.onChange(item.nama)
                onSelected?.(item)
                setOpen(false)
              }}
            >
              {item.nama}
            </button>
          ))}
          {!isPending && !data.length && (
            <p className="p-3 text-sm">Nama baru bisa langsung diketik.</p>
          )}
        </div>
      )}
      {error && (
        <span className="label-text-alt text-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
