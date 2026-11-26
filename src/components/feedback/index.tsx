import type { ReactNode } from 'react'
import { AlertCircle, Inbox } from 'lucide-react'

export function EmptyState({
  title,
  description,
  action,
  searching = false,
}: {
  title: string
  description?: string
  action?: ReactNode
  searching?: boolean
}) {
  return (
    <section className="card bg-base-200 text-base-content" aria-live="polite">
      <div className="card-body items-center text-center">
        <span className="rounded-full bg-base-100 p-3">
          <Inbox aria-hidden="true" />
        </span>
        <h2 className="card-title">{title}</h2>
        {description && <p>{description}</p>}
        {searching && action ? (
          <div className="card-actions">{action}</div>
        ) : (
          action && <div className="card-actions">{action}</div>
        )}
      </div>
    </section>
  )
}

export type SkeletonVariant = 'table-rows' | 'cards' | 'text' | 'form'
export function Skeleton({
  variant = 'table-rows',
  count = 4,
}: {
  variant?: SkeletonVariant
  count?: number
}) {
  const rows = Array.from({ length: Math.max(1, count) }, (_, index) => index)
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Memuat">
      <span className="sr-only">Memuat...</span>
      {variant === 'text' &&
        rows.map((row) => (
          <div key={row} className={`skeleton h-4 ${row === 0 ? 'w-3/4' : 'w-full'}`} />
        ))}
      {variant === 'form' &&
        rows.map((row) => (
          <div key={row} className="space-y-2">
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton h-12 w-full" />
          </div>
        ))}
      {variant === 'table-rows' &&
        rows.map((row) => <div key={row} className="skeleton h-12 w-full rounded-box" />)}
      {variant === 'cards' &&
        rows.map((row) => (
          <div key={row} className="space-y-3 rounded-box border border-base-300 p-4">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ))}
    </div>
  )
}

export function ErrorState({
  message = 'Data gagal dimuat.',
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <section role="alert" className="alert alert-error">
      <AlertCircle aria-hidden="true" />
      <div>
        <h2 className="font-bold">{message}</h2>
        <p>Silakan coba lagi.</p>
      </div>
      <button className="btn btn-outline" onClick={onRetry}>
        Coba lagi
      </button>
    </section>
  )
}
