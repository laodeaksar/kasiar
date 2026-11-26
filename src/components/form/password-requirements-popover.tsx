import { useLayoutEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { getPasswordAssessment, type PasswordRequirement } from '../../lib/password-strength'

type PasswordRequirementsPopoverProps = {
  password: string
  username?: string
  open: boolean
  containerRef: { current: HTMLDivElement | null }
  id: string
}

export function PasswordRequirementsPopover({
  password,
  username,
  open,
  containerRef,
  id,
}: PasswordRequirementsPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<'above' | 'below'>('above')
  const assessment = getPasswordAssessment(password, username)

  useLayoutEffect(() => {
    if (!open) return
    const updatePlacement = () => {
      const container = containerRef.current
      const panel = panelRef.current
      if (!container || !panel) return
      const topSpace = container.getBoundingClientRect().top
      const panelHeight = panel.getBoundingClientRect().height
      setPlacement(topSpace >= panelHeight + 12 ? 'above' : 'below')
    }
    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    return () => window.removeEventListener('resize', updatePlacement)
  }, [containerRef, open, password, username])

  const required = assessment.requirements.filter((requirement) => requirement.group === 'wajib')
  const recommended = assessment.requirements.filter(
    (requirement) => requirement.group === 'disarankan',
  )

  return (
    <div
      ref={panelRef}
      id={id}
      className={`pointer-events-none absolute left-0 z-50 w-full max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-xl ${open ? (placement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2') : 'sr-only'}`}
      role="group"
      aria-label="Syarat password"
    >
      <p className="mb-2 font-semibold">Syarat password</p>
      <RequirementGroup title="Wajib" requirements={required} />
      <RequirementGroup title="Disarankan (agar Kuat)" requirements={recommended} />
      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Jenis karakter">
        {assessment.characterKinds.map((kind) => (
          <span
            key={kind.id}
            className={`badge badge-sm ${kind.present ? 'badge-success' : 'badge-error'}`}
          >
            <span className="sr-only">{kind.present ? 'Ada: ' : 'Belum ada: '}</span>
            {kind.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function RequirementGroup({
  title,
  requirements,
}: {
  title: string
  requirements: PasswordRequirement[]
}) {
  return (
    <div className="mt-2">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/70">
        {title}
      </p>
      <ul className="space-y-1">
        {requirements.map((requirement) => (
          <li
            key={requirement.id}
            className={`flex items-start gap-2 ${requirement.met ? 'text-success' : 'text-error'}`}
          >
            {requirement.met ? (
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <span>{requirement.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
