import type { ReactNode } from 'react'
import { Link, type RegisteredRouter, type ToPathOption } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

type HeaderButtonBaseProps = {
  icon: LucideIcon
  label: string
  variant?: 'utama' | 'biasa' | 'bahaya'
  disabled?: boolean
  loading?: boolean
}
type InternalLinkTarget = ToPathOption<RegisteredRouter>

type HeaderButtonProps = HeaderButtonBaseProps &
  ({ to: InternalLinkTarget; onClick?: never } | { to?: undefined; onClick: () => void })

const variantClass: Record<NonNullable<HeaderButtonBaseProps['variant']>, string> = {
  utama: 'btn-primary',
  biasa: 'btn-ghost',
  bahaya: 'btn-error btn-outline',
}

const buttonSizeClass =
  'h-11 min-h-11 w-11 min-w-11 shrink-0 gap-2 p-0 sm:h-11 sm:min-h-11 sm:w-auto sm:min-w-11 sm:px-4'

function ButtonContents({
  icon: Icon,
  label,
  loading,
}: Pick<HeaderButtonBaseProps, 'icon' | 'label' | 'loading'>) {
  return (
    <>
      {loading ? (
        <span className="loading loading-spinner loading-sm" aria-hidden="true" />
      ) : (
        <Icon className="size-5" aria-hidden="true" />
      )}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </>
  )
}

export function HeaderButton(props: HeaderButtonProps) {
  const { icon, label, variant = 'biasa', disabled = false, loading = false } = props
  const unavailable = disabled || loading
  const className = `btn ${variantClass[variant]} ${buttonSizeClass}${unavailable ? ' opacity-50' : ''}`

  if ('to' in props && typeof props.to === 'string') {
    return (
      <Link
        to={props.to}
        className={className}
        aria-label={label}
        aria-disabled={unavailable || undefined}
        aria-busy={loading || undefined}
        tabIndex={unavailable ? -1 : undefined}
        onClick={(event) => {
          if (unavailable) event.preventDefault()
        }}
      >
        <ButtonContents icon={icon} label={label} loading={loading} />
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={unavailable}
      onClick={props.onClick}
    >
      <ButtonContents icon={icon} label={label} loading={loading} />
    </button>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  className = '',
  headingLevel = 1,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  headingLevel?: 1 | 2
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <header className={`flex min-w-0 items-start justify-between gap-2 ${className}`}>
      <div className="min-w-0 flex-1">
        <Heading className="truncate text-2xl font-bold">{title}</Heading>
        {description && <p className="mt-1 text-sm text-base-content/70">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-nowrap items-center gap-2">{actions}</div>}
    </header>
  )
}
