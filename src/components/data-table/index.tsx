import { useEffect, useState } from 'react'
import { flexRender } from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'
import { getCoreRowModel, useLegacyTable as useReactTable, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import type { ListResponse } from '../../types/api'
import { formatJumlah, formatRupiah, formatTanggal } from '../../lib/format'
import { EmptyState, ErrorState, Skeleton } from '../feedback'

export type MobilePriority = 'judul' | 'detail' | 'sembunyi'
type KasiarColumnMeta = { mobilePriority?: MobilePriority }
type TableColumn<T extends RowData> = ColumnDef<T, unknown> & { meta?: KasiarColumnMeta }
type DataTableProps<T extends RowData> = { columns: TableColumn<T>[]; data: ListResponse<T>; caption: string; rowKey?: (row: T, index: number) => string }

export function DataTable<T extends RowData>({ columns, data, caption, rowKey }: DataTableProps<T>) {
  const table = useReactTable({ data: data.rows, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true, pageCount: Math.ceil(data.total / data.pageSize) })
  const rows = table.getRowModel().rows
  if (rows.length === 0) return null
  return <>
    <div className="space-y-3 md:hidden" aria-label={caption}>{rows.map((row, index) => {
      const cells = row.getVisibleCells()
      const heading = cells.find((cell) => (cell.column.columnDef.meta as KasiarColumnMeta | undefined)?.mobilePriority === 'judul') ?? cells[0]
      return <article key={rowKey?.(row.original, index) ?? row.id} className="card border border-base-300 bg-base-100"><div className="card-body gap-2 p-4">
        <h3 className="card-title text-base">{flexRender(heading.column.columnDef.cell, heading.getContext())}</h3>
        {cells.filter((cell) => cell.id !== heading.id && (cell.column.columnDef.meta as KasiarColumnMeta | undefined)?.mobilePriority !== 'sembunyi').map((cell) => <div key={cell.id} className="flex flex-wrap justify-between gap-2 border-t border-base-300 pt-2 text-sm"><span className="font-medium">{String(cell.column.columnDef.header ?? '')}</span><span>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span></div>)}
      </div></article>
    })}</div>
    <div className="hidden overflow-x-auto rounded-box border border-base-300 md:block"><table className="table table-zebra"><caption className="sr-only">{caption}</caption><thead><tr>{table.getHeaderGroups().map((group) => group.headers.map((header) => <th key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>))}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>
  </>
}

export function DataTablePagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize)); const first = total ? (page - 1) * pageSize + 1 : 0; const last = Math.min(page * pageSize, total)
  return <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Paginasi daftar"><p className="text-sm">{first} sampai {last} dari {total}</p><div className="join"><button className="btn join-item min-h-11" aria-label="Halaman sebelumnya" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Sebelumnya</button><span className="btn join-item min-h-11" aria-current="page">{page} / {pages}</span><button className="btn join-item min-h-11" aria-label="Halaman berikutnya" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Berikutnya</button></div></nav>
}

export function DataTableSearch({ value, onChange, label = 'Cari' }: { value: string; onChange: (value: string) => void; label?: string }) {
  return <DataTableSearchInput key={value} value={value} onChange={onChange} label={label} />
}

function DataTableSearchInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => { const timer = window.setTimeout(() => { if (draft !== value) onChange(draft) }, 350); return () => window.clearTimeout(timer) }, [draft, value, onChange])
  return <label className="form-control w-full max-w-md"><span className="label-text mb-1">{label}</span><input className="input input-bordered min-h-12" type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ketik untuk mencari..." /></label>
}

export function DataTableToolbar({ children }: { children: React.ReactNode }) { return <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">{children}</div> }
export function DataTableStates({ loading, error, isEmpty = false, isSearchEmpty, query, onRetry, onClearSearch }: { loading?: boolean; error?: boolean; isEmpty?: boolean; isSearchEmpty?: boolean; query?: string; onRetry?: () => void; onClearSearch?: () => void }) {
  if (loading) return <Skeleton variant="table-rows" />
  if (error) return <ErrorState onRetry={onRetry ?? (() => undefined)} />
  if (!isEmpty) return null
  return <EmptyState title={isSearchEmpty ? `Tidak ada hasil untuk “${query ?? ''}”.` : 'Belum ada data.'} action={isSearchEmpty && onClearSearch ? <button className="btn btn-outline" onClick={onClearSearch}>Hapus pencarian</button> : undefined} searching={isSearchEmpty} />
}

export const RupiahCell = ({ value }: { value: number }) => <span className="whitespace-nowrap">{formatRupiah(value)}</span>
export const JumlahCell = ({ value, unit }: { value: number; unit?: string }) => <span>{formatJumlah(value, unit)}</span>
export const TanggalCell = ({ value }: { value: string | Date }) => <time dateTime={value instanceof Date ? value.toISOString() : value}>{formatTanggal(value)}</time>
export function StatusBadge({ status }: { status: string }) { const known: Record<string, string> = { lunas: 'Lunas', utang: 'Utang', aktif: 'Aktif', nonaktif: 'Nonaktif' }; return <span className="badge badge-outline">{known[status.toLocaleLowerCase()] ?? status}</span> }
export function AksiMenu({ children }: { children: React.ReactNode }) { return <div className="flex flex-wrap gap-2">{children}</div> }
