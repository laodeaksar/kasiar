import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'

type ModalSize = 'kecil' | 'sedang' | 'besar'
type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  descriptionId?: string
  size?: ModalSize
  canClose?: boolean
  closeGuard?: () => boolean | Promise<boolean>
  initialFocusRef?: { current: HTMLElement | null }
  children: ReactNode
}

const RequestCloseContext = createContext<(() => void) | null>(null)

export function Modal({
  open,
  onClose,
  title,
  descriptionId,
  size = 'sedang',
  canClose = true,
  closeGuard,
  initialFocusRef,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const backdropPointerDown = useRef(false)
  const closing = useRef(false)
  const reactId = useId()
  const titleId = `modal-title-${reactId.replaceAll(':', '')}`
  const latest = useRef({ open, onClose, canClose, closeGuard })
  useEffect(() => {
    latest.current = { open, onClose, canClose, closeGuard }
  }, [open, onClose, canClose, closeGuard])

  const requestClose = useCallback(async () => {
    const current = latest.current
    if (!current.open || !current.canClose || closing.current) return
    closing.current = true
    try {
      const allowed = current.closeGuard ? await current.closeGuard() : true
      const updated = latest.current
      if (allowed && updated.open && updated.canClose) updated.onClose()
    } catch {
      // Jika pemeriksaan sebelum tutup gagal, pertahankan modal tetap terbuka.
    } finally {
      closing.current = false
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const previousOverflow = document.body.style.overflow
    if (!dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'

    const scrollFocusedFieldIntoView = () => {
      const active = document.activeElement
      if (
        active instanceof HTMLElement &&
        dialog.contains(active) &&
        active.closest('[data-modal-body]')
      ) {
        active.scrollIntoView({ block: 'nearest' })
      }
    }
    const frame = window.requestAnimationFrame(() => {
      if (!dialog.open) return
      const firstField = dialog.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
      )
      const target =
        initialFocusRef?.current ??
        firstField ??
        dialog.querySelector<HTMLElement>('[data-modal-action]:not([disabled])') ??
        closeButtonRef.current
      target?.focus({ preventScroll: true })
      scrollFocusedFieldIntoView()
    })
    window.visualViewport?.addEventListener('resize', scrollFocusedFieldIntoView)

    return () => {
      window.cancelAnimationFrame(frame)
      window.visualViewport?.removeEventListener('resize', scrollFocusedFieldIntoView)
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [initialFocusRef, open])

  function onPointerDown(event: React.PointerEvent<HTMLDialogElement>) {
    backdropPointerDown.current = event.target === event.currentTarget
  }
  function onPointerUp(event: React.PointerEvent<HTMLDialogElement>) {
    const endedOnBackdrop = event.target === event.currentTarget
    const beganOnBackdrop = backdropPointerDown.current
    backdropPointerDown.current = false
    if (beganOnBackdrop && endedOnBackdrop) void requestClose()
  }

  const sizeClasses: Record<ModalSize, string> = {
    kecil: 'sm:w-[24rem]',
    sedang: 'sm:w-[32rem]',
    besar: 'sm:w-[42rem]',
  }

  return (
    <RequestCloseContext.Provider
      value={() => {
        void requestClose()
      }}
    >
      <dialog
        ref={dialogRef}
        className="modal modal-bottom sm:modal-middle kasiar-modal fixed inset-0 h-dvh w-screen max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-base-content sm:p-4"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-modal="true"
        onCancel={(event) => {
          event.preventDefault()
          void requestClose()
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          backdropPointerDown.current = false
        }}
      >
        <div
          className={`modal-box flex max-h-[90dvh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl rounded-b-none bg-base-100 p-0 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100vw-2rem)] sm:rounded-box ${sizeClasses[size]}`}
        >
          <header className="relative flex shrink-0 items-center border-b border-base-300 px-4 py-3 pr-16 sm:px-6">
            <h2 id={titleId} className="text-lg font-semibold sm:text-xl">
              {title}
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="btn btn-ghost btn-square absolute right-2 top-1/2 size-11 min-h-11 min-w-11 -translate-y-1/2 disabled:opacity-40"
              aria-label="Tutup"
              data-modal-close="true"
              disabled={!canClose}
              onClick={() => {
                void requestClose()
              }}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>
          {children}
        </div>
      </dialog>
    </RequestCloseContext.Provider>
  )
}

export function ModalBody({ children, className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      data-modal-body="true"
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 ${className}`}
    >
      {children}
    </div>
  )
}

export function ModalFooter({
  children,
  className = '',
  ...props
}: ComponentPropsWithoutRef<'footer'>) {
  return (
    <footer
      {...props}
      className={`flex shrink-0 flex-wrap justify-end gap-2 border-t border-base-300 bg-base-100 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4 ${className}`}
    >
      {children}
    </footer>
  )
}

export function useModalClose() {
  const requestClose = useContext(RequestCloseContext)
  if (!requestClose) throw new Error('useModalClose harus digunakan di dalam Modal.')
  return requestClose
}
