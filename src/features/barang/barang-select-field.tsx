import { useState, type RefObject } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { FieldElementProps } from '@formisch/react'
import { pilihanBarangOptions, type PilihanBarang } from '../barang-masuk/queries'

type FieldStore = {
  path: readonly PropertyKey[]
  input: unknown
  errors: [string, ...string[]] | null
  isTouched: boolean
  onChange(value: unknown): void
  props: FieldElementProps
}
type Props = {
  field: FieldStore
  selected: PilihanBarang | null
  onSelected: (item: PilihanBarang | null) => void
  inputRef?: RefObject<HTMLInputElement | null>
}

export function BarangSelectField({ field, selected, onSelected, inputRef }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { data: options = [], isPending, isError } = useQuery(pilihanBarangOptions(query, open))
  const error = field.isTouched ? field.errors?.[0] : undefined
  const id = 'field-barangId'

  return (
    <div
      className="form-control relative w-full gap-1.5"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <label className="label py-0" htmlFor={id}>
        <span className="label-text font-medium">
          Barang <span aria-hidden="true">*</span>
        </span>
      </label>
      <input
        {...field.props}
        ref={inputRef}
        id={id}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="barang-pilihan-list"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input input-bordered min-h-12 w-full ${error ? 'input-error' : ''}`}
        value={open ? query : (selected?.nama ?? '')}
        placeholder="Cari nama barang..."
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          field.onChange(0)
          onSelected(null)
        }}
      />
      {open && (
        <div
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-box border border-base-300 bg-base-100 shadow-lg"
          role="listbox"
          id="barang-pilihan-list"
        >
          {isPending && (
            <p className="p-3 text-sm" role="status">
              Mencari barang...
            </p>
          )}
          {isError && (
            <p className="p-3 text-sm text-error" role="alert">
              Barang gagal dimuat. Coba lagi.
            </p>
          )}
          {!isPending && !isError && options.length === 0 && (
            <p className="p-3 text-sm">Barang tidak ditemukan.</p>
          )}
          {!isPending &&
            options.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected?.id === item.id}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left hover:bg-base-200 focus:bg-base-200"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  field.onChange(item.id)
                  onSelected(item)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <span>{item.nama}</span>
                <span className="text-sm text-base-content/70">{item.satuan}</span>
              </button>
            ))}
        </div>
      )}
      {error && (
        <span id={`${id}-error`} className="label-text-alt text-error" role="alert">
          {error}
        </span>
      )}
      {selected && !open && (
        <span className="label-text-alt text-base-content/70">
          Harga jual saat ini: Rp {selected.hargaJual.toLocaleString('id-ID')}
        </span>
      )}
    </div>
  )
}
